import type { Metadata } from 'next';
import { Link } from '../components/Link';
import { RegisterForm } from './RegisterForm';
import { getAuthSessionAction } from '../login/actions';

export const metadata: Metadata = {
  title: 'Customer Registration | WooCommerce Next.js',
  description: 'Create a new customer account to access WooCommerce order history and fast checkout',
};

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const session = await getAuthSessionAction();

  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition">
            ← Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground transition">
            Store Catalog
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Sign Up</span>
        </div>

        {/* If Already Logged In */}
        {session.authenticated && session.user ? (
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              You Are Already Signed In
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You are currently logged in as <strong>{session.user.name}</strong>.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/login"
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-90"
              >
                View Account Profile
              </Link>
              <Link
                href="/products"
                className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
              >
                Browse Store Catalog
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <RegisterForm />

            {/* Account Benefits Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                WooCommerce Account Perks
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">📦 Live Order Tracking</div>
                  <p>View real-time fulfillment status and order history.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">⚡ Faster Checkout</div>
                  <p>Save shipping addresses for seamless recurring purchases.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">🔒 JWT Protected</div>
                  <p>Encrypted HttpOnly session security backed by WordPress.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
