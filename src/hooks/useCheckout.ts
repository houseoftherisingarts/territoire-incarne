import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";

export type CheckoutPurpose = "order" | "event" | "class" | "subscription";

export interface CheckoutLineItem {
  name: string;
  description?: string;
  amount: number; // integer cents
  quantity: number;
  image?: string;
}

export interface CheckoutRequest {
  purpose: CheckoutPurpose;
  metadata: Record<string, string>;
  lineItems?: CheckoutLineItem[];
  priceId?: string;
  successPath?: string;
  cancelPath?: string;
}

export interface CheckoutResponse {
  url: string | null;
  id: string;
}

const functions = getFunctions(app, "us-central1");
const createSession = httpsCallable<CheckoutRequest, CheckoutResponse>(
  functions,
  "createCheckoutSession",
);

/** Trigger Stripe Checkout. Throws on auth or network errors. */
export async function startCheckout(req: CheckoutRequest): Promise<void> {
  const { data } = await createSession(req);
  if (!data.url) throw new Error("No checkout URL returned");
  window.location.href = data.url;
}
