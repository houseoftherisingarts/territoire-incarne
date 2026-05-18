import { ShoppingBag, Trash2 } from "lucide-react";
import type { CartItem } from "../../types";
import type { Content } from "../../i18n";

interface Props {
  cart: CartItem[];
  subtotal: number;
  onRemove: (index: number) => void;
  onCheckout: () => void;
  t: Content["general"];
}

export const CartSidebar = ({ cart, subtotal, onRemove, onCheckout, t }: Props) => (
  <div className="w-full">
    <div className="sticky top-8 bg-stone-100 dark:bg-stone-800/50 p-6 rounded-[30px] shadow-md border border-stone-200 dark:border-stone-700">
      <div className="flex items-center gap-3 mb-4 border-b border-stone-300 dark:border-stone-600 pb-2">
        <ShoppingBag className="text-rust dark:text-white" size={18} />
        <span className="font-sans text-xs tracking-widest uppercase">{t.cartTotal}</span>
      </div>

      <div className="space-y-2 mb-6 max-h-48 overflow-y-auto custom-scrollbar">
        {cart.length === 0 ? (
          <div className="text-xs opacity-50 italic py-2">{t.cartEmpty}</div>
        ) : (
          cart.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm items-center group">
              <span className="truncate pr-2">{item.name}</span>
              <div className="flex items-center gap-2">
                <span>${item.price}</span>
                <button
                  onClick={() => onRemove(idx)}
                  aria-label={`Remove ${item.name}`}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-stone-300 dark:border-stone-600 pt-4 space-y-1">
        <div className="flex justify-between text-xs uppercase tracking-widest opacity-60">
          <span>
            {cart.length} {t.articles}
          </span>
          <span>${subtotal}</span>
        </div>
        <div className="flex justify-between text-xs uppercase tracking-widest opacity-60">
          <span>{t.shipping}</span>
          <span>{subtotal > 0 ? t.shippingCost : "$0"}</span>
        </div>
        <div className="flex justify-between font-serif text-xl pt-2 text-rust dark:text-white">
          <span>Total</span>
          <span>${subtotal > 0 ? subtotal + 30 : 0}</span>
        </div>
      </div>

      {cart.length > 0 && (
        <button
          onClick={onCheckout}
          className="w-full mt-6 px-4 py-3 bg-rust text-white dark:bg-white dark:text-forest text-xs uppercase tracking-widest hover:opacity-90 rounded-[30px]"
        >
          {t.checkout}
        </button>
      )}
    </div>
  </div>
);
