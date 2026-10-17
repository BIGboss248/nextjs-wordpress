'use client';

import { useActionState, useState, useTransition, useEffect } from 'react';
import { Link } from '../components/Link';
import {
  loginAction,
  verifyAuthAction,
  logoutAction,
  LoginActionResult,
  VerifyAuthResult,
} from './actions';

export function LoginForm() {
  const [loginState, formAction, isLoggingIn] = useActionState<LoginActionResult | null, FormData>(
    loginAction,
    null
  );

  const [showPassword, setShowPassword] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyAuthResult | null>(null);
  const [isVerifying, startVerifyTransition] = useTransition();
  const [isLoggingOut, startLogoutTransition] = useTransition();

  // When login succeeds, navigate to /login to let the Server Component render the UserProfileView
  useEffect(() => {
    if (loginState?.success) {
      const timer = setTimeout(() => {
        window.location.href = '/login';
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [loginState]);

  const handleVerify = () => {
    startVerifyTransition(async () => {
      const res = await verifyAuthAction();
      setVerifyResult(res);
    });
  };

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logoutAction();
      setVerifyResult(null);
      window.location.href = '/login';
    });
  };

  // Strip raw HTML from WordPress error strings (e.g. <strong>Error:</strong>)
  const formatErrorMessage = (msg?: string | null) => {
    if (!msg) return '';
    return msg.replace(/<[^>]*>/g, '').replace(/&lt;[^&]*&gt;/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Login Form Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Sign In to Your Account
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your WooCommerce or WordPress store credentials to authenticate.
          </p>
        </div>

        {/* Error Feedback Alert */}
        {loginState && !loginState.success && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <span>Authentication Error</span>
            </div>
            <p className="pl-6 leading-relaxed">
              {formatErrorMessage(loginState.error)}
            </p>
          </div>
        )}

        {/* Success Alert */}
        {loginState && loginState.success && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Authentication Successful! Loading your profile...</span>
            </div>
            <p className="pl-4 text-muted-foreground">
              Welcome back, <strong>{loginState.user?.name}</strong>. Redirecting to your account dashboard.
            </p>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Username or Email
            </label>
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="Enter your username or email"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>
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
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || Boolean(loginState?.success)}
            className="w-full mt-2 rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Authenticating with WooCommerce...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-border text-center text-xs text-muted-foreground">
          <span>Don&apos;t have a customer account? </span>
          <Link
            href="/register"
            className="font-semibold text-foreground underline underline-offset-4 hover:opacity-80"
          >
            Sign up here
          </Link>
        </div>
      </div>

      {/* Diagnostics & Cookie Persistence Verifier */}
      <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Session & Cookie Persistence Inspector
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              {isVerifying ? 'Checking...' : 'Verify Stored Cookie'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-50"
            >
              Clear Session
            </button>
          </div>
        </div>

        {/* Dynamic Verification Output */}
        {verifyResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
              verifyResult.authenticated
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5">
                <span>{verifyResult.authenticated ? '✅' : '⚠️'}</span>
                <span>
                  {verifyResult.authenticated
                    ? 'Session Verified via Cookie!'
                    : 'Session Status Notice'}
                </span>
              </span>
              <span className="font-mono opacity-80 text-[11px]">
                Cookie: {verifyResult.cookieFound ? 'Present' : 'Not Found'}
              </span>
            </div>

            {verifyResult.authenticated && verifyResult.user && (
              <p>
                Server validated JWT from cookie against WordPress GraphQL <code>viewer</code>. Authenticated as <strong>{verifyResult.user.name}</strong> (ID: #{verifyResult.user.databaseId || verifyResult.user.id}).
              </p>
            )}

            {!verifyResult.authenticated && (
              <p>{verifyResult.error}</p>
            )}
          </div>
        )}

        {!verifyResult && (
          <p className="text-[11px] text-muted-foreground">
            Stored in secure <strong>HttpOnly</strong> cookie <code>auth_token</code> with <code>SameSite=Lax</code>.
          </p>
        )}
      </div>
    </div>
  );
}
