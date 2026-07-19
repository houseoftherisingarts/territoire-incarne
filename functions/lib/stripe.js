"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_BASE_URL = exports.getStripe = void 0;
const stripe_1 = require("stripe");
let _stripe = null;
const getStripe = () => {
    if (_stripe)
        return _stripe;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key)
        throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new stripe_1.default(key, { apiVersion: "2024-12-18.acacia" });
    return _stripe;
};
exports.getStripe = getStripe;
exports.APP_BASE_URL = process.env.APP_BASE_URL ?? "https://territoireincarne.ca";
//# sourceMappingURL=stripe.js.map