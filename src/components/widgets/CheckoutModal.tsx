import { CreditCard, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { CartItem } from "../../types";
import type { Content } from "../../i18n";

interface Props {
  cart: CartItem[];
  subtotal: number;
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
  t: Content["general"];
}

export const CheckoutModal = ({ cart, subtotal, onClose, onConfirm, confirming, t }: Props) => {
  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-paper dark:bg-stone-900 p-8 max-w-md w-full shadow-2xl relative animate-[fadeIn_0.3s_ease-out] rounded-[30px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4">
          <X size={20} />
        </button>
        <h2 className="font-serif text-3xl mb-6">{t.checkout}</h2>
        <div className="mb-6 space-y-2 text-sm opacity-70 border-b border-stone-300 pb-4">
          {cart.map((c, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{c.name}</span>
              <span>${c.price.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-2">
            <span>{t.shipping}</span>
            <span>{t.shippingCost}</span>
          </div>
          <div className="flex justify-between font-bold text-rust dark:text-white pt-2 text-lg">
            <span>Total</span>
            <span>${(subtotal + 30).toFixed(2)}</span>
          </div>
        </div>
        <button
          onClick={onConfirm}
          disabled={confirming}
          className="w-full mt-2 bg-ink text-white dark:bg-white dark:text-black py-3 text-xs uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-2 rounded-[30px] disabled:opacity-50"
        >
          <CreditCard size={14} /> {confirming ? "Redirection…" : "Payer avec Stripe"}
        </button>
        <p className="text-[10px] font-sans uppercase tracking-widest opacity-50 text-center mt-3">
          Paiement sécurisé · CAD
        </p>
      </div>
    </div>,
    document.body,
  );
};
