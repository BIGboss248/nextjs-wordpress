import { cookies } from "next/headers";
import { Link } from "./components/Link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const isLoggedIn = allCookies.some(
    (c) => c.name.startsWith("wordpress_logged_in_") || c.name === "auth_token"
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Next.js WordPress Application
        </h1>
        <p className="text-lg text-muted-foreground">
          Enterprise App Router development environment configured with Tailwind CSS, Jest, Playwright, Traefik containerization, and Release Please CI/CD.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:opacity-90"
          >
            Customer Sign Up
          </Link>

          {isLoggedIn ? (
            <Link
              href="/account"
              className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 shadow-sm transition hover:bg-emerald-500/20"
            >
              My Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
            >
              Account / Sign In
            </Link>
          )}

          <Link
            href="/products"
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
          >
            Store Catalog
          </Link>
          <Link
            href="/cart"
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
          >
            Shopping Cart
          </Link>
          <Link
            href="/api/health"
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
          >
            Health Probe
          </Link>
        </div>
      </div>
    </main>
  );
}
