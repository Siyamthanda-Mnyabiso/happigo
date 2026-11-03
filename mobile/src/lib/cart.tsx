import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addToCart, type Cart, cartCount, EMPTY_CART, parseCart, serializeCart, setQty } from '@core/cart';

const KEY = 'hg_cart';

type CartApi = {
  cart: Cart;
  count: number;
  add: (branchId: string, itemId: string, qty?: number) => void;
  setQuantity: (itemId: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartApi | null>(null);

/**
 * The cart is ids and quantities only, kept on the device. Names and prices are always read from the
 * database and place_order checks everything again, so nothing stored here can change what you pay.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setCart(parseCart(raw ?? undefined)))
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, serializeCart(cart)).catch(() => undefined);
  }, [cart, ready]);

  const add = useCallback((branchId: string, itemId: string, qty = 1) => {
    setCart((c) => {
      let next = c;
      for (let i = 0; i < qty; i++) next = addToCart(next, branchId, itemId);
      return next;
    });
  }, []);
  const setQuantity = useCallback((itemId: string, qty: number) => setCart((c) => setQty(c, itemId, qty)), []);
  const clear = useCallback(() => setCart(EMPTY_CART), []);

  const value = useMemo(() => ({ cart, count: cartCount(cart), add, setQuantity, clear }), [cart, add, setQuantity, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart must be inside CartProvider');
  return v;
}
