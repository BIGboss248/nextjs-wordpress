import type { Metadata } from 'next';
import { Link } from '../components/Link';
import { LoginForm } from './LoginForm';
import { UserProfileView } from './UserProfileView';
import { getAuthSessionAction } from './actions';

export const metadata: Metadata = {
  title: 'WooCommerce Customer Account & Login | Next.js',
  description: 'Authenticate and manage your WooCommerce customer profile via Next.js and WPGraphQL',
};

// Force dynamic server rendering so authentication cookies are read on every request
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getAuthSessionAction();

  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
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
          <span className="text-foreground font-medium">
            {session.authenticated ? 'Account Profile' : 'Sign In'}
          </span>
        </div>

        {/* View Switching: Authenticated Profile vs. Login Form */}
        {session.authenticated && session.user ? (
          <UserProfileView
            user={session.user}
            customer={session.customer}
          />
        ) : (
          <div className="space-y-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">
                WooCommerce Customer Sign In
              </h1>
              <p className="text-sm text-muted-foreground">
                Authenticate securely to access your profile, shipping addresses, and order history.
              </p>
            </div>

            <LoginForm />

            {/* Architecture & Persistence Guide */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                How Headless WooCommerce Authentication Works
              </h3>

              <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground leading-relaxed">
                <li>
                  <strong className="text-foreground">JWT Token Generation:</strong> The login mutation queries WordPress <code>wp-graphql-jwt-authentication</code>, returning a cryptographically signed token.
                </li>
                <li>
                  <strong className="text-foreground">HttpOnly Cookie Storage:</strong> Next.js Server Actions store the token in a secure <code>auth_token</code> cookie inaccessible to browser JavaScript (protecting from XSS).
                </li>
                <li>
                  <strong className="text-foreground">Session Hydration:</strong> On page loads, Server Components automatically query <code>viewer</code> and <code>customer</code> with the cookie, hydrating your orders and profile server-side.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
