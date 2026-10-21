import { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Link } from '../components/Link';
import { fetchWooCommerce } from '@/lib/woocommerce/client';
import { GET_USER_PROFILE_QUERY } from '@/lib/woocommerce/queries';
import { UserProfileQueryResult, WordPressUser } from '@/lib/woocommerce/types';
import { CustomerDashboard, CustomerDashboardSkeleton } from '../components/account/CustomerDashboard';

export const metadata: Metadata = {
  title: 'My Account | Customer Dashboard',
  description: 'Manage your customer orders, shipping addresses, and account details',
};

// Force dynamic rendering so incoming authentication cookies are verified on every request
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const isLoggedIn = allCookies.some(
    (c) => c.name.startsWith('wordpress_logged_in_') || c.name === 'auth_token'
  );

  if (!isLoggedIn) {
    redirect('/login?redirect_to=/account');
  }

  // Forward all browser cookies so WPGraphQL authenticates via WordPress auth cookies
  const cookieHeader = allCookies.map((c) => `${c.name}=${c.value}`).join('; ');
  const authToken = cookieStore.get('auth_token')?.value;

  const res = await fetchWooCommerce<UserProfileQueryResult>(GET_USER_PROFILE_QUERY, {
    cookie: cookieHeader,
    authToken,
  });

  const viewer = res.data?.viewer;
  const customer = res.data?.customer;

  const user: WordPressUser = viewer || {
    id: customer?.id || 'customer',
    databaseId: customer?.databaseId ?? undefined,
    name: customer?.displayName || 'Customer',
    email: customer?.email ?? undefined,
  };

  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition">
            ← Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground transition">
            Store Catalog
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Customer Dashboard</span>
        </div>

        {/* Dashboard Title & Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your headless WooCommerce account dashboard powered by Next.js and WPGraphQL.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
            >
              <span>View Cart</span>
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-90"
            >
              <span>Shop More</span>
            </Link>
          </div>
        </div>

        {/* Customer Profile & Orders View */}
        <Suspense fallback={<CustomerDashboardSkeleton />}>
          <CustomerDashboard user={user} customer={customer} />
        </Suspense>
      </div>
    </main>
  );
}
