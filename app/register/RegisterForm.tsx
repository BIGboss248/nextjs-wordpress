'use client';

import { useActionState, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '../components/Link';
import { registerCustomerAction, RegisterActionResult } from './actions';

export function RegisterForm() {
  const router = useRouter();
  const [registerState, formAction, isRegistering] = useActionState<
    RegisterActionResult | null,
    FormData
  >(registerCustomerAction, null);

  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // When registration succeeds, redirect to /login to view the hydrated account dashboard
  useEffect(() => {
    if (registerState?.success) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [registerState, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setClientError(null);
    const form = e.currentTarget;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;
    const confirmPassword = (
      form.elements.namedItem('confirmPassword') as HTMLInputElement
    )?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      e.preventDefault();
      setClientError('Passwords do not match. Please verify both password fields.');
    }
  };

  const formatErrorMessage = (msg?: string | null) => {
    if (!msg) return '';
    return msg.replace(/<[^>]*>/g, '').replace(/&lt;[^&]*&gt;/g, '');
  };

  const activeError = clientError || (registerState && !registerState.success ? formatErrorMessage(registerState.error) : null);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Customer Registration
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Create your account to start shopping and tracking orders.
          </p>
        </div>

        {/* Error Alert */}
        {activeError && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <span>Registration Notice</span>
            </div>
            <p className="pl-6 leading-relaxed">{activeError}</p>
          </div>
        )}

        {/* Success Alert */}
        {registerState && registerState.success && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Account Created Successfully!</span>
            </div>
            <p className="pl-4 text-muted-foreground">
              Welcome, <strong>{registerState.username}</strong>.
              {registerState.autoLoggedIn
                ? ' You are authenticated. Loading your new account dashboard...'
                : ' Redirecting to sign in...'}
            </p>
          </div>
        )}

        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="e.g. john_doe"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>

          <button
            type="submit"
            disabled={isRegistering || Boolean(registerState?.success)}
            className="w-full mt-2 rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRegistering ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Creating Customer Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-border text-center text-xs text-muted-foreground">
          <span>Already have a customer account? </span>
          <Link
            href="/login"
            className="font-semibold text-foreground underline underline-offset-4 hover:opacity-80"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
