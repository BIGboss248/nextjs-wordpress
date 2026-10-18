import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sign In | Redirecting to WooCommerce...',
  description: 'Offloaded authentication redirect to native WooCommerce login portal',
};

// Force dynamic server rendering so cookies and searchParams are read per request
export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: Promise<{
    redirect_to?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

/**
 * Headless Login Route:
 * Offloads authentication directly to native WooCommerce (/my-account/).
 *
 * Uses the absolute WordPress URL so that Next.js client-side router
 * triggers a full native browser navigation rather than attempting an internal SPA route transition.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = await searchParams;
  let targetRedirect = '/account';

  if (typeof resolvedParams?.redirect_to === 'string') {
    const candidate = resolvedParams.redirect_to.trim();
    // Prevent open redirect vulnerabilities by strictly allowing internal relative paths
    if (candidate.startsWith('/') && !candidate.startsWith('//')) {
      targetRedirect = candidate;
    }
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const isLoggedIn = allCookies.some(
    (c) => c.name.startsWith('wordpress_logged_in_') || c.name === 'auth_token'
  );

  // If already logged in, redirect straight to target destination
  if (isLoggedIn) {
    redirect(targetRedirect);
  }

  // Offload to WordPress WooCommerce login form via absolute URL to force full browser navigation
  const wpBaseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://shop.local';
  redirect(`${wpBaseUrl}/my-account/?redirect_to=${encodeURIComponent(targetRedirect)}`);
}
