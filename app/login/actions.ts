'use server';

import { cookies } from 'next/headers';
import { fetchWooCommerce, getViewer, getUserProfile } from '@/lib/woocommerce/client';
import { LOGIN_MUTATION } from '@/lib/woocommerce/queries';
import { LoginMutationPayload, WordPressUser, WooCommerceCustomer } from '@/lib/woocommerce/types';

export interface LoginActionResult {
  success: boolean;
  error?: string | null;
  user?: WordPressUser | null;
  tokenPreview?: string;
  fullTokenLength?: number;
  hasCustomerSession?: boolean;
}

export interface VerifyAuthResult {
  authenticated: boolean;
  cookieFound: boolean;
  user?: WordPressUser | null;
  error?: string | null;
  tokenPreview?: string;
}

/**
 * Server Action: Authenticate with WordPress using wp-graphql-jwt-authentication
 * Sets secure HttpOnly cookie upon success.
 */
export async function loginAction(
  prevState: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    return {
      success: false,
      error: 'Username and password are required.',
    };
  }

  try {
    const res = await fetchWooCommerce<LoginMutationPayload>(LOGIN_MUTATION, {
      variables: {
        username,
        password,
      },
    });

    if (res.error || !res.data?.login) {
      return {
        success: false,
        error: res.error || 'Login failed. Invalid response from WordPress.',
      };
    }

    console.log(res.data);
    const { authToken, user, customer } = res.data.login;
    const cookieStore = await cookies();

    // Store JWT in secure HttpOnly cookie (protects from XSS)
    cookieStore.set('auth_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Store WooCommerce customer session if returned
    if (customer?.sessionToken) {
      cookieStore.set('wc_session', customer.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    const tokenPreview =
      authToken.length > 25
        ? `${authToken.slice(0, 16)}...${authToken.slice(-10)}`
        : authToken;

    return {
      success: true,
      user,
      tokenPreview,
      fullTokenLength: authToken.length,
      hasCustomerSession: Boolean(customer?.sessionToken),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message,
    };
  }
}

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

/**
 * Server Action: Verify if auth_token cookie persists and is valid against WordPress
 */
export async function verifyAuthAction(): Promise<VerifyAuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return {
      authenticated: false,
      cookieFound: false,
      error: "No 'auth_token' cookie found in browser cookie jar.",
    };
  }

  const tokenPreview =
    token.length > 25
      ? `${token.slice(0, 16)}...${token.slice(-10)}`
      : token;

  // Inspect JWT expiration time locally
  const payload = parseJwtPayload(token);
  if (payload?.exp && Date.now() >= payload.exp * 1000) {
    const expDate = new Date(payload.exp * 1000);
    return {
      authenticated: false,
      cookieFound: true,
      tokenPreview,
      error: `JWT token in cookie expired at ${expDate.toLocaleTimeString()} (default WordPress JWT lifetime is 5 minutes). Please sign in again.`,
    };
  }

  // Validate token directly with WordPress GraphQL viewer query
  const res = await getViewer(token);

  if (!res.data?.viewer) {
    return {
      authenticated: false,
      cookieFound: true,
      tokenPreview,
      error: res.error || 'Cookie exists, but JWT token was rejected by WordPress (expired or invalid signature).',
    };
  }

  return {
    authenticated: true,
    cookieFound: true,
    tokenPreview,
    user: res.data.viewer,
  };
}

/**
 * Server Action: Logout and remove authentication cookies
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  for (const c of allCookies) {
    if (
      c.name.startsWith('wordpress_') ||
      c.name.startsWith('wp_') ||
      c.name === 'auth_token' ||
      c.name === 'wc_session'
    ) {
      cookieStore.delete(c.name);
    }
  }
  return { success: true };
}

export interface AuthSessionResult {
  authenticated: boolean;
  user?: WordPressUser | null;
  customer?: WooCommerceCustomer | null;
  error?: string | null;
}

/**
 * Server Action: Retrieve the full authenticated user and WooCommerce customer session
 */
export async function getAuthSessionAction(): Promise<AuthSessionResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return { authenticated: false };
  }

  const payload = parseJwtPayload(token);
  if (payload?.exp && Date.now() >= payload.exp * 1000) {
    return {
      authenticated: false,
      error: 'Token expired',
    };
  }

  const res = await getUserProfile(token);
  const hasViewer = Boolean(res.data?.viewer?.id || res.data?.viewer?.name);
  const hasCustomer = Boolean(res.data?.customer?.id && res.data.customer.id !== 'guest');

  if (!hasViewer && !hasCustomer) {
    return {
      authenticated: false,
      error: res.error || 'Failed to authenticate user profile session.',
    };
  }

  const user: WordPressUser = res.data?.viewer || {
    id: res.data?.customer?.id || 'customer',
    databaseId: res.data?.customer?.databaseId || undefined,
    name: res.data?.customer?.displayName || 'Customer',
    email: res.data?.customer?.email || undefined,
  };

  return {
    authenticated: true,
    user,
    customer: res.data?.customer || null,
  };
}

