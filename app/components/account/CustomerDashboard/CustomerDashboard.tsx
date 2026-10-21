'use client';

import * as React from 'react';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/app/components/Link';
import { logoutAction } from '@/app/login/actions';
import { WordPressUser, WooCommerceCustomer } from '@/lib/woocommerce/types';
import { cn } from '@/lib/utils';

export interface CustomerDashboardProps {
  /**
   * Authenticated WordPress user entity containing basic identity
   */
  user: WordPressUser;

  /**
   * WooCommerce customer profile entity containing billing details and order nodes
   */
  customer?: WooCommerceCustomer | null;

  /**
   * Optional custom container styling classes
   */
  className?: string;
}

/**
 * Production-ready Customer Dashboard component.
 * Renders user profile information, active session indicator,
 * synchronized billing addresses, recent order records, and logout actions.
 */
export function CustomerDashboard({
  user,
  customer,
  className,
}: CustomerDashboardProps) {
  const t = useTranslations('account');
  const [isLoggingOut, startLogoutTransition] = useTransition();

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logoutAction();
      window.location.reload();
    });
  };

  const displayName = customer?.displayName || user.name || 'Customer';
  const email = customer?.email || user.email || '';
  const customerId = customer?.databaseId || user.databaseId || user.id;
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';
  const orders = customer?.orders?.nodes || [];
  const billing = customer?.billing;
  const hasBilling = Boolean(
    billing?.address1 || billing?.city || billing?.phone || billing?.email
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Profile Header Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            {/* Visual Avatar with user initial */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-sm">
              {initial}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {displayName}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t('activeSession')}
                </span>
              </div>
              {email && (
                <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
              )}
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {t('customerId', { id: customerId })}
              </p>
            </div>
          </div>

          {/* Logout Action Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-destructive shadow-sm transition hover:bg-destructive/10 hover:border-destructive/30 disabled:opacity-50 cursor-pointer"
            >
              <svg
                className="w-4 h-4 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                />
              </svg>
              <span>{isLoggingOut ? t('signingOut') : t('signOut')}</span>
            </button>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            {t('subtitle')}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow transition hover:opacity-90"
          >
            <span>{t('browseCatalog')}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Account Details: Billing & Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Billing Address Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
              <span>{t('billingAddress')}</span>
            </h3>
          </div>

          {hasBilling ? (
            <div className="text-xs space-y-1.5 text-muted-foreground">
              {(billing?.firstName || billing?.lastName) && (
                <p className="font-medium text-foreground">
                  {billing?.firstName} {billing?.lastName}
                </p>
              )}
              {billing?.address1 && <p>{billing.address1}</p>}
              {billing?.city && (
                <p>
                  {billing.city}
                  {billing.country ? `, ${billing.country}` : ''}
                </p>
              )}
              {billing?.phone && (
                <p>{t('phone', { phone: billing.phone })}</p>
              )}
              {billing?.email && (
                <p>{t('email', { email: billing.email })}</p>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">
              <p>{t('noBillingAddress')}</p>
              <p className="text-[11px] opacity-80 mt-1">
                {t('billingSyncNotice')}
              </p>
            </div>
          )}
        </div>

        {/* Recent Orders Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <span>{t('recentOrders', { count: orders.length })}</span>
            </h3>
          </div>

          {orders.length > 0 ? (
            <div className="space-y-2.5">
              {orders.map((order) => (
                <div
                  key={order.id || order.orderNumber}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30 text-xs"
                >
                  <div>
                    <span className="font-semibold text-foreground block">
                      {t('orderNumber', { number: order.orderNumber })}
                    </span>
                    {order.date && (
                      <span className="text-[11px] text-muted-foreground block">
                        {new Date(order.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="text-end">
                    <span className="font-semibold text-foreground block">
                      {order.total || '—'}
                    </span>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted border border-border text-muted-foreground uppercase">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">
              <p>{t('noOrders')}</p>
              <p className="text-[11px] opacity-80 mt-1">
                {t('noOrdersNotice')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
