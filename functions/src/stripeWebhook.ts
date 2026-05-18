import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { getStripe } from "./stripe";

export const stripeWebhook = onRequest(
  {
    secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    region: "us-central1",
  },
  async (req, res) => {
    const stripe = getStripe();
    const sig = req.headers["stripe-signature"] as string | undefined;
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !secret) {
      res.status(400).send("Missing signature or webhook secret");
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, secret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      res.status(400).send("Invalid signature");
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await handleSubscriptionChange(event.data.object as Stripe.Subscription);
          break;
        case "invoice.payment_failed":
          await handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          // Ignore other events
          break;
      }
      res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler error:", err);
      res.status(500).send("Handler error");
    }
  },
);

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const purpose = meta.purpose;
  const uid = meta.firebaseUid;
  const db = getFirestore();

  if (!uid) {
    console.warn("Checkout completed without firebaseUid metadata", session.id);
    return;
  }

  const baseOrder = {
    sessionId: session.id,
    customerId: session.customer as string | null,
    amountTotal: session.amount_total,
    currency: session.currency,
    paymentStatus: session.payment_status,
    metadata: meta,
    completedAt: FieldValue.serverTimestamp(),
    userId: uid,
  };

  switch (purpose) {
    case "order":
      await db.collection("orders").add(baseOrder);
      // Decrement product stock from line_items metadata if present
      try {
        const stripe = getStripe();
        const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 50 });
        const productIds = (meta.productIds ?? "").split(",").filter(Boolean);
        await Promise.all(
          items.data.map(async (li, i) => {
            const productId = productIds[i];
            if (!productId) return;
            await db.doc(`products/${productId}`).update({
              stock: FieldValue.increment(-(li.quantity ?? 1)),
            });
          }),
        );
      } catch (err) {
        console.error("Stock decrement failed:", err);
      }
      break;
    case "event":
      if (meta.eventId) {
        await db
          .doc(`events/${meta.eventId}/registrations/${uid}`)
          .set(
            {
              ...baseOrder,
              status: "paid",
              registeredAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      }
      break;
    case "class":
      if (meta.classId) {
        await db
          .doc(`classes/${meta.classId}/requests/${uid}`)
          .set(
            {
              ...baseOrder,
              status: "paid",
              paidAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        await db
          .doc(`classes/${meta.classId}/members/${uid}`)
          .set(
            {
              joinedAt: FieldValue.serverTimestamp(),
              displayName: meta.displayName ?? "",
            },
            { merge: true },
          );
      }
      break;
    case "subscription": {
      const subId = session.subscription as string | undefined;
      if (subId) {
        await db.doc(`users/${uid}/subscriptions/${subId}`).set(
          {
            ...baseOrder,
            stripeSubscriptionId: subId,
            status: "active",
          },
          { merge: true },
        );
      }
      break;
    }
    default:
      console.warn("Unknown checkout purpose:", purpose);
  }
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  const uid = sub.metadata?.firebaseUid;
  if (!uid) return;
  const db = getFirestore();
  await db.doc(`users/${uid}/subscriptions/${sub.id}`).set(
    {
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const uid = invoice.metadata?.firebaseUid;
  if (!uid) return;
  const db = getFirestore();
  await db.collection(`users/${uid}/payment_failures`).add({
    invoiceId: invoice.id,
    amount: invoice.amount_due,
    createdAt: FieldValue.serverTimestamp(),
  });
}
