import { Link } from "./components/Link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Next.js WordPress Application
        </h1>
        <p className="text-lg text-muted-foreground">
          Enterprise App Router development environment configured with Tailwind CSS, Jest, Playwright, Traefik containerization, and Release Please CI/CD.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/api/health"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:opacity-90"
          >
            Health Probe
          </Link>
        </div>
      </div>
    </main>
  );
}

