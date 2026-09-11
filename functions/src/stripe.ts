import Stripe from "stripe";
import { HttpsError } from "firebase-functions/v2/https";

let _stripe: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  // Tant que la clé d'Élise n'est pas posée (docs/BRANCHEMENTS.md), le secret porte une valeur
  // de garde : la fonction répond « pas configuré » plutôt que de planter.
  if (!key || !key.startsWith("sk_")) throw new HttpsError("failed-precondition", "Le paiement n'est pas encore configuré.");
  _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return _stripe;
};

export const APP_BASE_URL =
  process.env.APP_BASE_URL ?? "https://territoireincarne.com";
