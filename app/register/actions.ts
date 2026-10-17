'use server';

import { cookies } from 'next/headers';
import { registerCustomer, fetchWooCommerce } from '@/lib/woocommerce/client';
import { LOGIN_MUTATION } from '@/lib/woocommerce/queries';
import { LoginMutationPayload } from '@/lib/woocommerce/types';

export interface RegisterActionResult {
  success: boolean;
  error?: string | null;
  autoLoggedIn?: boolean;
  username?: string;
  customerId?: string;
}

/**
 * Server Action: Register a new WooCommerce customer and optionally auto-login
 */
export async function registerCustomerAction(
  prevState: RegisterActionResult | null,
  formData: FormData
): Promise<RegisterActionResult> {
  const username = (formData.get('username') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!username || !email || !password) {
    return {
      success: false,
      error: 'Username, email address, and password are required.',
    };
  }

  if (username.length < 3) {
    return {
      success: false,
      error: 'Username must be at least 3 characters long.',
    };
  }

  // Basic email pattern validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: 'Please enter a valid email address.',
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters long.',
    };
  }

  if (confirmPassword && password !== confirmPassword) {
    return {
      success: false,
      error: 'Passwords do not match. Please re-enter your password.',
    };
  }

  try {
    // 1. Execute registerCustomer mutation via WooGraphQL
    const regRes = await registerCustomer({
      username,
      email,
      password,
    });

    if (regRes.error || !regRes.data?.registerCustomer?.customer) {
      return {
        success: false,
        error: regRes.error || 'Failed to create customer account.',
      };
    }

    const customerId = regRes.data.registerCustomer.customer.id;

    // 2. Perform seamless auto-login with newly created credentials
    try {
      const loginRes = await fetchWooCommerce<LoginMutationPayload>(LOGIN_MUTATION, {
        variables: {
          username,
          password,
        },
      });

      if (loginRes.data?.login?.authToken) {
        const { authToken, customer } = loginRes.data.login;
        const cookieStore = await cookies();

        cookieStore.set('auth_token', authToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        if (customer?.sessionToken) {
          cookieStore.set('wc_session', customer.sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });
        }

        return {
          success: true,
          autoLoggedIn: true,
          username,
          customerId,
        };
      }
    } catch {
      // Auto-login failed non-critically; user account was still created
    }

    return {
      success: true,
      autoLoggedIn: false,
      username,
      customerId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message,
    };
  }
}
