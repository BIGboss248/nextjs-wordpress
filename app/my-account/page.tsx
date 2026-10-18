import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface MyAccountPageProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

/**
 * Fallback Route for /my-account in Next.js:
 * If a request reaches Next.js directly (e.g. browsing on localhost:3000 or client-side navigation),
 * this immediately redirects the user to the native WooCommerce account portal on WordPress.
 */
export default async function MyAccountFallbackPage({ searchParams }: MyAccountPageProps) {
  const resolvedParams = await searchParams;
  const wpBaseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://shop.local';

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedParams || {})) {
    if (typeof value === 'string') {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  const destination = queryString
    ? `${wpBaseUrl}/my-account/?${queryString}`
    : `${wpBaseUrl}/my-account/`;

  redirect(destination);
}
