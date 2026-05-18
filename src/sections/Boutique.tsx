import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "../firebase";
import { CartSidebar } from "../components/widgets/CartSidebar";
import { CheckoutModal } from "../components/widgets/CheckoutModal";
import { requireAuth } from "../lib/requireAuth";
import { startCheckout } from "../hooks/useCheckout";
import type { Content } from "../i18n";
import type { CartItem } from "../types";
import type { Product } from "../components/admin/ProductsSection";

interface Props {
  content: Content["sections"]["boutique"];
  t: Content["general"];
  cart: CartItem[];
  subtotal: number;
  onAdd: (item: CartItem) => void;
  onRemove: (index: number) => void;
}

const useProducts = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "products"), where("active", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      setLoading(false);
    });
    return unsub;
  }, []);
  return { items, loading };
};

export const Boutique = ({ t, cart, subtotal, onAdd, onRemove }: Props) => {
  const { items: products, loading } = useProducts();
  const [user, setUser] = useState<User | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Group Firestore products by category
  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category || "Sans catégorie";
    (acc[cat] ??= []).push(p);
    return acc;
  }, {});

  const handleCheckout = async () => {
    setShowCheckout(true);
  };

  const proceedToStripe = async () => {
    requireAuth(user, async () => {
      setCheckingOut(true);
      try {
        const productIds = cart
          .map((c) => products.find((p) => p.title === c.name)?.id)
          .filter((id): id is string => Boolean(id));
        await startCheckout({
          purpose: "order",
          metadata: { productIds: productIds.join(",") },
          lineItems: cart.map((c) => {
            const p = products.find((pp) => pp.title === c.name);
            return {
              name: c.name,
              amount: p?.priceCents ?? Math.round(c.price * 100),
              quantity: 1,
              image: p?.image,
            };
          }) ?? undefined,
          successPath: "/boutique?paid=1",
          cancelPath: "/boutique",
        });
      } catch (err) {
        console.error("Checkout failed:", err);
        alert("Le paiement n'est pas encore configuré. Réessayez plus tard.");
        setCheckingOut(false);
      }
    });
  };

  if (loading) {
    return <p className="font-serif italic opacity-60 py-10 text-center">Chargement…</p>;
  }

  if (products.length === 0) {
    return (
      <p className="font-serif italic opacity-60 py-12 text-center">
        La boutique est en préparation — revenez bientôt.
      </p>
    );
  }

  return (
    <div className="animate-[fadeIn_1s_ease-out] flex flex-col lg:flex-row gap-10 xl:gap-16">
      <div className="flex-1 min-w-0 space-y-14">
        {Object.entries(grouped).map(([cat, list]) => (
              <div key={cat}>
                <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-rust dark:text-stone-400 mb-6 border-b border-stone-200 dark:border-stone-700 pb-2 inline-block">
                  {cat}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {list.map((p) => (
                    <ProductCard
                      key={p.id}
                      title={p.title}
                      desc={p.description}
                      price={p.priceCents / 100}
                      image={p.image}
                      stock={p.stock}
                      onAdd={() => onAdd({ name: p.title, price: p.priceCents / 100 })}
                      addLabel={t.addToCart}
                    />
                  ))}
                </div>
              </div>
            ))}
      </div>

      <div className="lg:w-72 xl:w-80 shrink-0">
        <CartSidebar
          cart={cart}
          subtotal={subtotal}
          onRemove={onRemove}
          onCheckout={handleCheckout}
          t={t}
        />
      </div>

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          subtotal={subtotal}
          onClose={() => setShowCheckout(false)}
          onConfirm={proceedToStripe}
          confirming={checkingOut}
          t={t}
        />
      )}
    </div>
  );
};

interface ProductCardProps {
  title: string;
  desc: string;
  price: number;
  image: string;
  stock: number;
  onAdd: () => void;
  addLabel: string;
}

const ProductCard = ({ title, desc, price, image, stock, onAdd, addLabel }: ProductCardProps) => {
  const sold = stock <= 0;
  return (
    <div className="relative group flex flex-col p-5 border border-stone-200 dark:border-stone-700 rounded-[20px] hover:border-rust dark:hover:border-stone-400 transition-colors bg-white/40 dark:bg-white/5">
      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-stone-200 dark:bg-stone-800">
        {image && (
          <img
            src={image}
            className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            alt={title}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <h4 className="font-serif text-lg leading-tight text-ink dark:text-stone-100 mb-1">{title}</h4>
      <p className="text-sm font-serif italic text-stone-500 dark:text-stone-400 leading-relaxed mb-3 line-clamp-2 min-h-[2.5rem]">
        {desc}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <span className="text-base font-sans text-rust dark:text-stone-300">${price.toFixed(2)}</span>
        <button
          onClick={onAdd}
          disabled={sold}
          className="px-4 py-1.5 text-[10px] uppercase tracking-widest border border-stone-300 hover:bg-ink hover:text-white dark:border-stone-600 dark:hover:bg-white dark:hover:text-forest rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sold ? "Rupture" : addLabel}
        </button>
      </div>
    </div>
  );
};
