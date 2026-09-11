"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_BASE_URL = exports.getStripe = void 0;
const stripe_1 = require("stripe");
const https_1 = require("firebase-functions/v2/https");
let _stripe = null;
const getStripe = () => {
    if (_stripe)
        return _stripe;
    const key = process.env.STRIPE_SECRET_KEY;
    // Tant que la clé d'Élise n'est pas posée (docs/BRANCHEMENTS.md), le secret porte une valeur
    // de garde : la fonction répond « pas configuré » plutôt que de planter.
    if (!key || !key.startsWith("sk_"))
        throw new https_1.HttpsError("failed-precondition", "Le paiement n'est pas encore configuré.");
    _stripe = new stripe_1.default(key, { apiVersion: "2025-02-24.acacia" });
    return _stripe;
};
exports.getStripe = getStripe;
exports.APP_BASE_URL = process.env.APP_BASE_URL ?? "https://territoireincarne.com";
//# sourceMappingURL=stripe.js.map