import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CustomerDashboardSkeletonProps {
  /** Optional container class overrides */
  className?: string;
}

/**
 * Suspense skeleton for CustomerDashboard.
 * Mirrors the exact geometry and responsive layout of the dashboard
 * to eliminate Cumulative Layout Shift (CLS).
 */
export function CustomerDashboardSkeleton({ className }: CustomerDashboardSkeletonProps) {
  return (
    <div
      data-testid="customer-dashboard-skeleton"
      aria-busy="true"
      aria-live="polite"
      className={cn('space-y-6', className)}
    >
      {/* Profile Header Card Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            {/* Avatar circle */}
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-36 rounded bg-muted animate-pulse" />
                <div className="h-5 w-24 rounded-full bg-muted animate-pulse" />
              </div>
              <div className="h-4 w-44 rounded bg-muted animate-pulse" />
              <div className="h-3 w-32 rounded bg-muted animate-pulse" />
            </div>
          </div>

          {/* Logout Button Skeleton */}
          <div className="h-9 w-24 rounded-lg bg-muted animate-pulse self-start sm:self-auto" />
        </div>

        {/* Action Shortcuts Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          <div className="h-8 w-36 rounded-md bg-muted animate-pulse" />
        </div>
      </div>

      {/* Grid: Billing Address & Recent Orders Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Billing Card Skeleton */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="border-b border-border pb-2.5">
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-2 pt-1">
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="h-4 w-56 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          </div>
        </div>

        {/* Orders Card Skeleton */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="border-b border-border pb-2.5">
            <div className="h-5 w-36 rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-2.5 pt-1">
            <div className="h-12 w-full rounded-lg bg-muted animate-pulse" />
            <div className="h-12 w-full rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
