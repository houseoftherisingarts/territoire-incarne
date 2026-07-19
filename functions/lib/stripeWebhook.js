"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const stripe_1 = require("./stripe");
exports.stripeWebhook = (0, https_1.onRequest)({
    secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    region: "us-central1",
}, async (req, res) => {
    const stripe = (0, stripe_1.getStripe)();
    const sig = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !secret) {
        res.status(400).send("Missing signature or webhook secret");
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, secret);
    }
    catch (err) {
        console.error("Webhook signature verification failed:", err);
        res.status(400).send("Invalid signature");
        return;
    }
    try {
        switch (event.type) {
            case "checkout.session.completed":
                await handleCheckoutCompleted(event.data.object);
                break;
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
                await handleSubscriptionChange(event.data.object);
                break;
            case "invoice.payment_failed":
                await handlePaymentFailed(event.data.object);
                break;
            default:
                // Ignore other events
                break;
        }
        res.json({ received: true });
    }
    catch (err) {
        console.error("Webhook handler error:", err);
        res.status(500).send("Handler error");
    }
});
async function handleCheckoutCompleted(session) {
    const meta = session.metadata ?? {};
    const purpose = meta.purpose;
    const uid = meta.firebaseUid;
    const db = (0, firestore_1.getFirestore)();
    if (!uid) {
        console.warn("Checkout completed without firebaseUid metadata", session.id);
        return;
    }
    const baseOrder = {
        sessionId: session.id,
        customerId: session.customer,
        amountTotal: session.amount_total,
        currency: session.currency,
        paymentStatus: session.payment_status,
        metadata: meta,
        completedAt: firestore_1.FieldValue.serverTimestamp(),
        userId: uid,
    };
    switch (purpose) {
        case "order":
            await db.collection("orders").add(baseOrder);
            // Decrement product stock from line_items metadata if present
            try {
                const stripe = (0, stripe_1.getStripe)();
                const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 50 });
                const productIds = (meta.productIds ?? "").split(",").filter(Boolean);
                await Promise.all(items.data.map(async (li, i) => {
                    const productId = productIds[i];
                    if (!productId)
                        return;
                    await db.doc(`products/${productId}`).update({
                        stock: firestore_1.FieldValue.increment(-(li.quantity ?? 1)),
                    });
                }));
            }
            catch (err) {
                console.error("Stock decrement failed:", err);
            }
            break;
        case "event":
            if (meta.eventId) {
                await db
                    .doc(`events/${meta.eventId}/registrations/${uid}`)
                    .set({
                    ...baseOrder,
                    status: "paid",
                    registeredAt: firestore_1.FieldValue.serverTimestamp(),
                }, { merge: true });
            }
            break;
        case "class":
            if (meta.classId) {
                await db
                    .doc(`classes/${meta.classId}/requests/${uid}`)
                    .set({
                    ...baseOrder,
                    status: "paid",
                    paidAt: firestore_1.FieldValue.serverTimestamp(),
                }, { merge: true });
                await db
                    .doc(`classes/${meta.classId}/members/${uid}`)
                    .set({
                    joinedAt: firestore_1.FieldValue.serverTimestamp(),
                    displayName: meta.displayName ?? "",
                }, { merge: true });
            }
            break;
        case "subscription": {
            const subId = session.subscription;
            if (subId) {
                await db.doc(`users/${uid}/subscriptions/${subId}`).set({
                    ...baseOrder,
                    stripeSubscriptionId: subId,
                    status: "active",
                }, { merge: true });
            }
            break;
        }
        default:
            console.warn("Unknown checkout purpose:", purpose);
    }
}
async function handleSubscriptionChange(sub) {
    const uid = sub.metadata?.firebaseUid;
    if (!uid)
        return;
    const db = (0, firestore_1.getFirestore)();
    await db.doc(`users/${uid}/subscriptions/${sub.id}`).set({
        status: sub.status,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
}
async function handlePaymentFailed(invoice) {
    const uid = invoice.metadata?.firebaseUid;
    if (!uid)
        return;
    const db = (0, firestore_1.getFirestore)();
    await db.collection(`users/${uid}/payment_failures`).add({
        invoiceId: invoice.id,
        amount: invoice.amount_due,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
//# sourceMappingURL=stripeWebhook.js.map