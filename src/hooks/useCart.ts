import { useMemo, useState } from "react";
import type { CartItem } from "../types";

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const add = (item: CartItem) => setCart((c) => [...c, item]);
  const removeAt = (index: number) =>
    setCart((c) => c.filter((_, i) => i !== index));
  const clear = () => setCart([]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price, 0),
    [cart]
  );

  return { cart, setCart, add, removeAt, clear, subtotal };
};
