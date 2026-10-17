'use client';

import * as React from 'react';
import { Link } from './Link';
import { useCart } from '@/lib/woocommerce/cart-context';

export function CartBadge() {
  const { itemCount, isLoading } = useCart();

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <svg
        className="h-4 w-4 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
      <span>Cart</span>
      <span
        className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold transition-all ${
          itemCount > 0
            ? 'bg-primary text-primary-foreground scale-100'
            : 'bg-muted text-muted-foreground scale-95'
        }`}
      >
        {isLoading ? '...' : itemCount}
      </span>
    </Link>
  );
}
