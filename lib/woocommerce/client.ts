import {
  GET_PRODUCTS_QUERY,
  GET_VIEWER_QUERY,
  GET_USER_PROFILE_QUERY,
  REGISTER_CUSTOMER_MUTATION,
  GET_CART_QUERY,
  ADD_TO_CART_MUTATION,
  UPDATE_CART_QUANTITIES_MUTATION,
  REMOVE_CART_ITEMS_MUTATION,
  EMPTY_CART_MUTATION,
  CHECKOUT_MUTATION,
  GET_ORDER_DETAILS_QUERY,
} from './queries';
import {
  ProductsQueryResult,
  ViewerQueryResult,
  UserProfileQueryResult,
  WooCommerceQueryResult,
  RegisterCustomerInput,
  RegisterCustomerPayload,
  CartQueryResult,
  AddToCartInput,
  AddToCartPayload,
  UpdateItemQuantitiesInput,
  UpdateItemQuantitiesPayload,
  RemoveItemsFromCartInput,
  RemoveItemsFromCartPayload,
  EmptyCartPayload,
  CheckoutInput,
  CheckoutPayload,
  OrderDetailsQueryResult,
} from './types';

export function getWordPressApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
    'http://localhost:8080/graphql'
  );
}

export interface FetchOptions {
  variables?: Record<string, unknown>;
  revalidate?: number | false;
  authToken?: string;
  sessionToken?: string;
  cookie?: string;
}

export interface WooCommerceFetchResponse<T> {
  data: T | null;
  error: string | null;
  endpoint: string;
  sessionToken?: string | null;
  tokenExpired?: boolean;
}

/**
 * Universal Next.js fetcher for WooCommerce GraphQL API
 */
export async function fetchWooCommerce<T>(
  query: string,
  options: FetchOptions = {}
): Promise<WooCommerceFetchResponse<T>> {
  const endpoint = getWordPressApiUrl();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const parsedUrl = new URL(endpoint);
      headers['Host'] = parsedUrl.host;
    } catch {}

    if (options.cookie) {
      headers['Cookie'] = options.cookie;
    }

    if (options.authToken) {
      headers['Authorization'] = `Bearer ${options.authToken}`;
      headers['X-JWT-Auth'] = options.authToken;
    }

    if (options.sessionToken) {
      const cleanToken = options.sessionToken.replace(/^Session\s+/i, '');
      headers['woocommerce-session'] = `Session ${cleanToken}`;
    }

    const fetchConfig: RequestInit = {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables: options.variables,
      }),
    };

    if (options.revalidate !== undefined) {
      fetchConfig.next = {
        revalidate: options.revalidate,
      };
    } else {
      fetchConfig.cache = 'no-store';
    }

    const res = await fetch(endpoint, fetchConfig);

    const rawSessionHeader = res.headers.get('woocommerce-session');
    const capturedSessionToken = rawSessionHeader
      ? rawSessionHeader.replace(/^Session\s+/i, '')
      : options.sessionToken || null;

    let json: { data?: T; errors?: Array<{ message: string }> } | null = null;
    try {
      json = await res.json();
    } catch {
      // not JSON or body already consumed
    }

    const hasValidData = Boolean(
      json?.data &&
      typeof json.data === 'object' &&
      Object.keys(json.data).length > 0 &&
      Object.values(json.data).some((val) => val !== null && val !== undefined)
    );

    // In WordPress/WPGraphQL setups, security filters or core REST auth hooks
    // may emit an HTTP 403 Forbidden header when customer Bearer tokens are sent,
    // while WPGraphQL still resolves the complete viewer and customer profile data.
    if (hasValidData && json?.data && (!json?.errors || json.errors.length === 0)) {
      return {
        data: json.data as T,
        error: null,
        endpoint,
        sessionToken: capturedSessionToken,
      };
    }

    // If WordPress rejected an authToken with 401 or 403, and no valid data was returned,
    // retry once without the invalid token so customer/guest session isn't bricked.
    if (options.authToken && !hasValidData && (res.status === 401 || res.status === 403)) {
      const retryHeaders = { ...headers };
      delete retryHeaders['Authorization'];
      delete retryHeaders['X-JWT-Auth'];

      const retryRes = await fetch(endpoint, {
        ...fetchConfig,
        headers: retryHeaders,
      });

      let retryJson: { data?: T; errors?: Array<{ message: string }> } | null = null;
      try {
        retryJson = await retryRes.json();
      } catch {}

      if (retryRes.ok && retryJson?.data) {
        const rawRetrySession = retryRes.headers.get('woocommerce-session');
        return {
          data: retryJson.data as T,
          error: null,
          endpoint,
          sessionToken: rawRetrySession ? rawRetrySession.replace(/^Session\s+/i, '') : capturedSessionToken,
          tokenExpired: true,
        };
      }
    }

    if (json?.errors && json.errors.length > 0) {
      const errorMsg = json.errors.map((e: { message: string }) => e.message).join(' | ');
      return {
        data: json.data || null,
        error: res.ok ? errorMsg : `${errorMsg} (HTTP ${res.status})`,
        endpoint,
        sessionToken: capturedSessionToken,
        tokenExpired: res.status === 401 || res.status === 403,
      };
    }

    if (!res.ok) {
      return {
        data: null,
        error: `HTTP ${res.status}: ${res.statusText}`,
        endpoint,
        sessionToken: capturedSessionToken,
        tokenExpired: res.status === 401 || res.status === 403,
      };
    }

    return {
      data: (json?.data as T) || null,
      error: null,
      endpoint,
      sessionToken: capturedSessionToken,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      data: null,
      error: message,
      endpoint,
      sessionToken: options.sessionToken || null,
    };
  }
}

/**
 * Fetch public catalog products
 */
export async function getProducts(first = 20): Promise<WooCommerceQueryResult<ProductsQueryResult>> {
  const res = await fetchWooCommerce<ProductsQueryResult>(GET_PRODUCTS_QUERY, {
    variables: { first },
    revalidate: 60, // ISR revalidation
  });

  return {
    data: res.data,
    error: res.error,
    endpoint: res.endpoint,
  };
}

/**
 * Fetch authenticated viewer profile using Bearer JWT token
 */
export async function getViewer(
  authToken: string
): Promise<WooCommerceQueryResult<ViewerQueryResult>> {
  const res = await fetchWooCommerce<ViewerQueryResult>(GET_VIEWER_QUERY, {
    authToken,
  });

  return {
    data: res.data,
    error: res.error,
    endpoint: res.endpoint,
  };
}

/**
 * Fetch full WooCommerce customer and WordPress viewer profile
 */
export async function getUserProfile(
  authToken: string
): Promise<WooCommerceQueryResult<UserProfileQueryResult>> {
  const res = await fetchWooCommerce<UserProfileQueryResult>(
    GET_USER_PROFILE_QUERY,
    {
      authToken,
    }
  );

  return {
    data: res.data,
    error: res.error,
    endpoint: res.endpoint,
  };
}

/**
 * Register a new customer via WooGraphQL
 */
export async function registerCustomer(
  input: RegisterCustomerInput
): Promise<WooCommerceQueryResult<RegisterCustomerPayload>> {
  const res = await fetchWooCommerce<RegisterCustomerPayload>(
    REGISTER_CUSTOMER_MUTATION,
    {
      variables: { input },
    }
  );

  return {
    data: res.data,
    error: res.error,
    endpoint: res.endpoint,
  };
}

/**
 * Fetch current cart session data
 */
export async function getCart(
  options: { authToken?: string; sessionToken?: string } = {}
): Promise<WooCommerceFetchResponse<CartQueryResult>> {
  return fetchWooCommerce<CartQueryResult>(GET_CART_QUERY, {
    authToken: options.authToken,
    sessionToken: options.sessionToken,
    revalidate: 0,
  });
}

/**
 * Add product to cart with quantity
 */
export async function addToCart(
  input: AddToCartInput,
  options: { authToken?: string; sessionToken?: string } = {}
): Promise<WooCommerceFetchResponse<AddToCartPayload>> {
  return fetchWooCommerce<AddToCartPayload>(ADD_TO_CART_MUTATION, {
    variables: { input },
    authToken: options.authToken,
    sessionToken: options.sessionToken,
  });
}

/**
 * Update item quantities in cart
 */
export async function updateCartItemQuantities(
  input: UpdateItemQuantitiesInput,
  options: { authToken?: string; sessionToken?: string } = {}
): Promise<WooCommerceFetchResponse<UpdateItemQuantitiesPayload>> {
  return fetchWooCommerce<UpdateItemQuantitiesPayload>(
    UPDATE_CART_QUANTITIES_MUTATION,
    {
      variables: { input },
      authToken: options.authToken,
      sessionToken: options.sessionToken,
    }
  );
}

/**
 * Remove items from cart by key
 */
export async function removeCartItems(
  input: RemoveItemsFromCartInput,
  options: { authToken?: string; sessionToken?: string } = {}
): Promise<WooCommerceFetchResponse<RemoveItemsFromCartPayload>> {
  return fetchWooCommerce<RemoveItemsFromCartPayload>(
    REMOVE_CART_ITEMS_MUTATION,
    {
      variables: { input },
      authToken: options.authToken,
      sessionToken: options.sessionToken,
    }
  );
}

/**
 * Empty the current cart
 */
export async function emptyCart(
  options: { authToken?: string; sessionToken?: string } = {}
): Promise<WooCommerceFetchResponse<EmptyCartPayload>> {
  return fetchWooCommerce<EmptyCartPayload>(EMPTY_CART_MUTATION, {
    variables: { input: { clearPersistentCart: true } },
    authToken: options.authToken,
    sessionToken: options.sessionToken,
  });
}

/**
 * Process checkout mutation in WooGraphQL
 */
export async function checkoutCart(
  input: CheckoutInput,
  options: { authToken?: string; sessionToken?: string } = {}
): Promise<WooCommerceFetchResponse<CheckoutPayload>> {
  return fetchWooCommerce<CheckoutPayload>(CHECKOUT_MUTATION, {
    variables: { input },
    authToken: options.authToken,
    sessionToken: options.sessionToken,
  });
}

/**
 * Fetch full order details by database ID
 */
export async function getOrderDetails(
  orderId: string | number,
  options: { authToken?: string; sessionToken?: string } = {}
): Promise<WooCommerceFetchResponse<OrderDetailsQueryResult>> {
  return fetchWooCommerce<OrderDetailsQueryResult>(GET_ORDER_DETAILS_QUERY, {
    variables: { id: String(orderId) },
    authToken: options.authToken,
    sessionToken: options.sessionToken,
  });
}


