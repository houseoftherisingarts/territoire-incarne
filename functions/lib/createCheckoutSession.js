"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const stripe_1 = require("./stripe");
exports.createCheckoutSession = (0, https_1.onCall)({
    secrets: ["STRIPE_SECRET_KEY"],
    region: "us-central1",
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Sign-in required");
    }
    const data = request.data;
    if (!data || !data.purpose) {
        throw new https_1.HttpsError("invalid-argument", "purpose is required");
    }
    // Only accept in-app relative paths for the post-checkout redirect, so a
    // forged successPath like "@evil.example/x" can't turn the Stripe redirect
    // into an open redirect that leaks the session_id.
    const safePath = (p, fallback) => typeof p === "string" && p.startsWith("/") && !p.startsWith("//") ? p : fallback;
    const successPath = safePath(data.successPath, "/");
    const cancelPath = safePath(data.cancelPath, "/");
    const stripe = (0, stripe_1.getStripe)();
    const db = (0, firestore_1.getFirestore)();
    const uid = request.auth.uid;
    // Reuse a Stripe Customer per Firebase user, stored on users/{uid}.stripeCustomerId
    const userRef = db.doc(`users/${uid}`);
    const userSnap = await userRef.get();
    const userData = userSnap.data() ?? {};
    let customerId = userData.stripeCustomerId;
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
        success_url: `${stripe_1.APP_BASE_URL}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${stripe_1.APP_BASE_URL}${cancelPath}`,
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
});
//# sourceMappingURL=createCheckoutSession.js.map