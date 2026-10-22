'use server';

import { cookies } from 'next/headers';
import {
  getCart,
  addToCart,
  updateCartItemQuantities,
  removeCartItems,
  emptyCart,
  checkoutCart,
  getUserProfile,
  getOrderDetails,
} from '@/lib/woocommerce/client';
import { CartData, CheckoutBillingInput, OrderDetails } from '@/lib/woocommerce/types';

function parseJwtPayload(token: string): { exp?: number; data?: { user?: { id?: string } } } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const jsonStr = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

async function getSessionContext() {
  const cookieStore = await cookies();
  let authToken = cookieStore.get('auth_token')?.value;
  const sessionToken = cookieStore.get('wc_session')?.value;

  // Inspect JWT expiration before attaching it to requests.
  // wp-graphql-jwt-authentication issues tokens with a 5-minute expiration by default.
  // Passing an expired token causes WordPress to reject cart mutations with HTTP 403.
  if (authToken) {
    const payload = parseJwtPayload(authToken);
    if (payload?.exp && Date.now() >= payload.exp * 1000) {
      try {
        cookieStore.delete('auth_token');
      } catch {
        // Safe fallback in read-only headers context
      }
      authToken = undefined;
    }
  }

  return { cookieStore, authToken, sessionToken };
}

function persistSessionToken(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  newSessionToken?: string | null,
  tokenExpired?: boolean
) {
  if (tokenExpired) {
    try {
      cookieStore.delete('auth_token');
    } catch {}
  }

  if (newSessionToken) {
    cookieStore.set('wc_session', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }
}

export interface ActionResult<T> {
  success: boolean;
  data?: T | null;
  error?: string | null;
}

/**
 * Fetch the active cart session state
 */
export async function getCartAction(): Promise<ActionResult<CartData>> {
  try {
    const { cookieStore, authToken, sessionToken } = await getSessionContext();

    const res = await getCart({ authToken, sessionToken });
    persistSessionToken(cookieStore, res.sessionToken, res.tokenExpired);

    if (res.error && !res.data?.cart) {
      return { success: false, error: res.error, data: null };
    }

    return {
      success: true,
      data: res.data?.cart || null,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      data: null,
    };
  }
}

/**
 * Add a product by database ID to the cart session (supports simple & variable products)
 */
export async function addToCartAction(input: {
  productId: number;
  quantity?: number;
  variationId?: number;
}): Promise<ActionResult<{ itemCount?: number; total?: string | null; subtotal?: string | null }>> {
  try {
    const { cookieStore, authToken, sessionToken } = await getSessionContext();

    const res = await addToCart(
      {
        productId: input.productId,
        quantity: input.quantity || 1,
        variationId: input.variationId,
      },
      { authToken, sessionToken }
    );

    persistSessionToken(cookieStore, res.sessionToken, res.tokenExpired);

    if (res.error || !res.data?.addToCart) {
      return {
        success: false,
        error: res.error || 'Failed to add product to cart',
      };
    }

    const cart = res.data.addToCart.cart;

    return {
      success: true,
      data: {
        itemCount: cart?.contents?.itemCount,
        total: cart?.total,
        subtotal: cart?.subtotal,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Update the quantity of a specific line item in the cart
 */
export async function updateCartQuantityAction(input: {
  key: string;
  quantity: number;
}): Promise<ActionResult<{ total?: string | null; subtotal?: string | null; itemCount?: number }>> {
  try {
    const { cookieStore, authToken, sessionToken } = await getSessionContext();

    const res = await updateCartItemQuantities(
      {
        items: [{ key: input.key, quantity: input.quantity }],
      },
      { authToken, sessionToken }
    );

    persistSessionToken(cookieStore, res.sessionToken, res.tokenExpired);

    if (res.error || !res.data?.updateItemQuantities) {
      return {
        success: false,
        error: res.error || 'Failed to update item quantity',
      };
    }

    const cart = res.data.updateItemQuantities.cart;

    return {
      success: true,
      data: {
        total: cart?.total,
        subtotal: cart?.subtotal,
        itemCount: cart?.contents?.itemCount,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Remove an item from the cart by its key
 */
export async function removeCartItemAction(
  key: string
): Promise<ActionResult<{ itemCount?: number; isEmpty?: boolean }>> {
  try {
    const { cookieStore, authToken, sessionToken } = await getSessionContext();

    const res = await removeCartItems(
      { keys: [key] },
      { authToken, sessionToken }
    );

    persistSessionToken(cookieStore, res.sessionToken, res.tokenExpired);

    if (res.error || !res.data?.removeItemsFromCart) {
      return {
        success: false,
        error: res.error || 'Failed to remove item from cart',
      };
    }

    const cart = res.data.removeItemsFromCart.cart;

    return {
      success: true,
      data: {
        itemCount: cart?.contents?.itemCount,
        isEmpty: cart?.isEmpty,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Empty all items from the cart
 */
export async function clearCartAction(): Promise<ActionResult<{ isEmpty: boolean }>> {
  try {
    const { cookieStore, authToken, sessionToken } = await getSessionContext();

    const res = await emptyCart({ authToken, sessionToken });
    persistSessionToken(cookieStore, res.sessionToken, res.tokenExpired);

    if (res.error && !res.data?.emptyCart) {
      return {
        success: false,
        error: res.error,
      };
    }

    return {
      success: true,
      data: { isEmpty: true },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface ProcessCheckoutResult {
  success: boolean;
  redirectUrl?: string | null;
  order?: {
    id: string;
    databaseId: number;
    orderNumber: string;
    total?: string | null;
    status?: string | null;
  } | null;
  error?: string | null;
}

/**
 * Executes the WooGraphQL checkout mutation to transfer the Next.js cart session
 * to a native WooCommerce order, returning the native payment redirect URL.
 */
export async function processCheckoutAction(input?: {
  billing?: CheckoutBillingInput;
  paymentMethod?: string;
  customerNote?: string;
}): Promise<ProcessCheckoutResult> {
  try {
    const { cookieStore, authToken, sessionToken } = await getSessionContext();

    if (!sessionToken && !authToken) {
      return {
        success: false,
        error: 'No active cart session found. Please add items to your cart first.',
      };
    }

    let billing = input?.billing;

    // If billing info was not provided and user is authenticated, pre-fill from user profile
    if ((!billing || !billing.email) && authToken) {
      try {
        const profile = await getUserProfile(authToken);
        const custBilling = profile.data?.customer?.billing;
        const custEmail = profile.data?.customer?.email || profile.data?.viewer?.email;
        const custName = profile.data?.customer?.displayName || profile.data?.viewer?.name;
        if (custBilling || custEmail) {
          billing = {
            firstName: custBilling?.firstName || custName?.split(' ')[0] || 'Customer',
            lastName: custBilling?.lastName || custName?.split(' ').slice(1).join(' ') || 'User',
            email: custBilling?.email || custEmail || undefined,
            phone: custBilling?.phone || undefined,
            address1: custBilling?.address1 || undefined,
            city: custBilling?.city || undefined,
            country: custBilling?.country || 'IR',
            ...billing,
          };
        }
      } catch {
        // Fallback to provided billing
      }
    }

    // Ensure required gateway fields (phone, address, city, names, email) have valid values
    billing = {
      firstName: billing?.firstName || 'Customer',
      lastName: billing?.lastName || 'User',
      email: billing?.email || 'customer@meetjamali.com',
      phone: billing?.phone || '09120000000',
      address1: billing?.address1 || 'Online Order Address',
      city: billing?.city || 'Tehran',
      country: billing?.country || 'IR',
      ...billing,
    };

    const checkoutRes = await checkoutCart(
      {
        clientMutationId: `checkout-${Date.now()}`,
        isPaid: false,
        paymentMethod: input?.paymentMethod || 'WC_ZPal',
        customerNote: input?.customerNote,
        billing,
      },
      { authToken, sessionToken }
    );

    persistSessionToken(cookieStore, checkoutRes.sessionToken, checkoutRes.tokenExpired);

    const checkoutData = checkoutRes.data?.checkout;
    if (checkoutRes.error || !checkoutData) {
      return {
        success: false,
        error: checkoutRes.error || 'Checkout process could not be completed',
      };
    }

    return {
      success: true,
      redirectUrl: checkoutData.redirect || null,
      order: checkoutData.order || null,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface CartItemTransfer {
  databaseId: number;
  quantity: number;
  variationId?: number;
}

/**
 * Retrieve the native WooCommerce checkout URL.
 * Passes all cart items via `fill_cart` (supporting simple and variable products)
 * directly to the WooCommerce checkout page, allowing the user to select an address
 * and see dynamic shipping calculations.
 */
export async function getCheckoutUrlAction(
  items?: CartItemTransfer[] | CartItemTransfer,
  customerInfo?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    address1?: string;
    city?: string;
  }
): Promise<{ url: string }> {
  const base = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://shop.local';
  const cleanBase = base.replace(/\/$/, '');

  let itemList: CartItemTransfer[] = Array.isArray(items)
    ? items
    : items && items.databaseId
    ? [items]
    : [];

  // Server-side fallback: if items were not provided or empty, inspect active WooGraphQL cart session
  if (itemList.length === 0) {
    try {
      const { authToken, sessionToken } = await getSessionContext();
      if (authToken || sessionToken) {
        const cartRes = await getCart({ authToken, sessionToken });
        const nodes = cartRes.data?.cart?.contents?.nodes || [];
        itemList = nodes
          .map((node) => {
            const dbId = node.product?.node?.databaseId;
            const varId = node.variation?.node?.databaseId;
            return dbId
              ? {
                  databaseId: dbId,
                  quantity: node.quantity || 1,
                  ...(varId ? { variationId: varId } : {}),
                }
              : null;
          })
          .filter((item): item is CartItemTransfer => item !== null);
      }
    } catch {
      // Fallback to empty itemList
    }
  }

  if (itemList.length === 0) {
    return {
      url: `${cleanBase}/checkout/`,
    };
  }

  const fillCartParam = itemList
    .map(
      (item) =>
        `${item.databaseId}:${item.quantity || 1}${
          item.variationId ? `:${item.variationId}` : ''
        }`
    )
    .join(',');

  const params = new URLSearchParams();

  // Multi-item & variation-aware transfer parameter handled by headless-redirects.php MU-plugin
  params.set('fill_cart', fillCartParam);

  // Pre-populate customer contact details if available
  if (customerInfo?.email) params.set('billing_email', customerInfo.email);
  if (customerInfo?.phone) params.set('billing_phone', customerInfo.phone);
  if (customerInfo?.firstName) params.set('billing_first_name', customerInfo.firstName);
  if (customerInfo?.lastName) params.set('billing_last_name', customerInfo.lastName);
  if (customerInfo?.address1) params.set('billing_address_1', customerInfo.address1);
  if (customerInfo?.city) params.set('billing_city', customerInfo.city);

  return {
    url: `${cleanBase}/checkout/?${params.toString()}`,
  };
}

/**
 * Retrieve full order confirmation details by database ID
 */
export async function getOrderDetailsAction(
  orderId: string | number
): Promise<ActionResult<OrderDetails>> {
  try {
    const { cookieStore, authToken, sessionToken } = await getSessionContext();
    const res = await getOrderDetails(orderId, { authToken, sessionToken });
    persistSessionToken(cookieStore, res.sessionToken, res.tokenExpired);

    if (res.error && !res.data?.order) {
      return { success: false, error: res.error, data: null };
    }

    return {
      success: true,
      data: res.data?.order || null,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      data: null,
    };
  }
}


