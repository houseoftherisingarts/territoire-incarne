import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStripe, APP_BASE_URL } from "./stripe";

type Purpose = "order" | "event" | "class" | "subscription";

interface LineItemInput {
  name: string;
  description?: string;
  amount: number; // integer cents
  quantity: number;
  image?: string;
}

interface RequestData {
  purpose: Purpose;
  /** Free-form metadata copied to the Stripe Session for the webhook to dispatch on. */
  metadata: Record<string, string>;
  lineItems: LineItemInput[];
  /** Subscription mode: a Stripe Price ID instead of inline line item amounts. */
  priceId?: string;
  /** Optional successful-redirect path; we add `?session_id={CHECKOUT_SESSION_ID}` */
  successPath?: string;
  cancelPath?: string;
}

export const createCheckoutSession = onCall(
  {
    secrets: ["STRIPE_SECRET_KEY"],
    region: "us-central1",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign-in required");
    }

    const data = request.data as RequestData;
    if (!data || !data.purpose) {
      throw new HttpsError("invalid-argument", "purpose is required");
    }

    // Only accept in-app relative paths for the post-checkout redirect, so a
    // forged successPath like "@evil.example/x" can't turn the Stripe redirect
    // into an open redirect that leaks the session_id.
    const safePath = (p: string | undefined, fallback: string): string =>
      typeof p === "string" && p.startsWith("/") && !p.startsWith("//") ? p : fallback;
    const successPath = safePath(data.successPath, "/");
    const cancelPath = safePath(data.cancelPath, "/");

    const stripe = getStripe();
    const db = getFirestore();
    const uid = request.auth.uid;

    // Reuse a Stripe Customer per Firebase user, stored on users/{uid}.stripeCustomerId
    const userRef = db.doc(`users/${uid}`);
    const userSnap = await userRef.get();
    const userData = userSnap.data() ?? {};
    let customerId: string | undefined = userData.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: request.auth.token.email ?? undefined,
        name: request.auth.token.name ?? undefined,
        metadata: { firebaseUid: uid },
      });
      customerId = customer.id;
      await userRef.set({ stripeCustomerId: customerId }, { merge: true });
    }

    const isSubscription = data.purpose === "subscription";

    const lineItems = data.priceId
      ? [{ price: data.priceId, quantity: 1 }]
      : data.lineItems.map((li) => ({
          quantity: li.quantity,
          price_data: {
            currency: "cad",
            unit_amount: li.amount,
            product_data: {
              name: li.name,
              description: li.description,
              images: li.image ? [li.image] : undefined,
            },
          },
        }));

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      customer: customerId,
      line_items: lineItems,
      success_url: `${APP_BASE_URL}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}${cancelPath}`,
      metadata: { ...data.metadata, firebaseUid: uid, purpose: data.purpose },
      ...(isSubscription
        ? {}
        : {
            payment_intent_data: {
              metadata: { ...data.metadata, firebaseUid: uid, purpose: data.purpose },
            },
          }),
    });

    return { url: session.url, id: session.id };
  },
);
