'use client';

import * as React from 'react';
import { CartData } from './types';
import {
  getCartAction,
  addToCartAction,
  updateCartQuantityAction,
  removeCartItemAction,
  clearCartAction,
  getCheckoutUrlAction,
} from '@/app/cart/actions';

interface CartContextValue {
  cart: CartData | null;
  itemCount: number;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number, variationId?: number) => Promise<{ success: boolean; error?: string | null }>;
  updateQuantity: (key: string, quantity: number) => Promise<{ success: boolean; error?: string | null }>;
  removeItem: (key: string) => Promise<{ success: boolean; error?: string | null }>;
  clearCart: () => Promise<{ success: boolean; error?: string | null }>;
  checkoutUrl: string;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = React.useState<CartData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isMutating, setIsMutating] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = React.useState<string>(
    'https://shop.meetjamali.com/checkout'
  );

  const refreshCart = React.useCallback(async () => {
    try {
      setError(null);
      const res = await getCartAction();
      if (res.success && res.data) {
        setCart(res.data);
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  React.useEffect(() => {
    const rawNodes = cart?.contents?.nodes || [];
    const cartItems = rawNodes
      .map((node) => {
        const dbId = node.product?.node?.databaseId;
        return dbId ? { databaseId: dbId, quantity: node.quantity || 1 } : null;
      })
      .filter((item): item is { databaseId: number; quantity: number } => item !== null);

    if (cartItems.length > 0) {
      getCheckoutUrlAction(cartItems).then((res) => {
        if (res?.url) setCheckoutUrl(res.url);
      });
    } else {
      getCheckoutUrlAction().then((res) => {
        if (res?.url) setCheckoutUrl(res.url);
      });
    }
  }, [cart]);

  const handleAddToCart = React.useCallback(
    async (productId: number, quantity = 1, variationId?: number) => {
      setIsMutating(true);
      setError(null);
      try {
        const res = await addToCartAction({ productId, quantity, variationId });
        if (res.success) {
          await refreshCart();
          return { success: true };
        } else {
          setError(res.error || 'Failed to add item to cart');
          return { success: false, error: res.error };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsMutating(false);
      }
    },
    [refreshCart]
  );

  const handleUpdateQuantity = React.useCallback(
    async (key: string, quantity: number) => {
      setIsMutating(true);
      setError(null);
      try {
        if (quantity <= 0) {
          const removeRes = await removeCartItemAction(key);
          await refreshCart();
          return { success: removeRes.success, error: removeRes.error };
        }

        const res = await updateCartQuantityAction({ key, quantity });
        if (res.success) {
          await refreshCart();
          return { success: true };
        } else {
          setError(res.error || 'Failed to update quantity');
          return { success: false, error: res.error };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsMutating(false);
      }
    },
    [refreshCart]
  );

  const handleRemoveItem = React.useCallback(
    async (key: string) => {
      setIsMutating(true);
      setError(null);
      try {
        const res = await removeCartItemAction(key);
        if (res.success) {
          await refreshCart();
          return { success: true };
        } else {
          setError(res.error || 'Failed to remove item');
          return { success: false, error: res.error };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsMutating(false);
      }
    },
    [refreshCart]
  );

  const handleClearCart = React.useCallback(async () => {
    setIsMutating(true);
    setError(null);
    try {
      const res = await clearCartAction();
      if (res.success) {
        await refreshCart();
        return { success: true };
      } else {
        setError(res.error || 'Failed to clear cart');
        return { success: false, error: res.error };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsMutating(false);
    }
  }, [refreshCart]);

  const itemCount = cart?.contents?.itemCount || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        isLoading,
        isMutating,
        error,
        refreshCart,
        addToCart: handleAddToCart,
        updateQuantity: handleUpdateQuantity,
        removeItem: handleRemoveItem,
        clearCart: handleClearCart,
        checkoutUrl,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
