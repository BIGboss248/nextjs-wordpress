"use client";

import * as React from "react";
import NextLink from "next/link";
import { useProgress } from "react-transition-progress";

export interface LinkProps extends React.ComponentProps<typeof NextLink> {
  /**
   * Prefetch strategy:
   * - `null` / `undefined` (default): Prefetches shared App Shell.
   * - `true`: Prefetches App Shell AND dynamic params.
   * - `false`: Disables viewport prefetching.
   */
  prefetch?: boolean;
}

const WP_NATIVE_ROUTES = [
  "/my-account",
  "/checkout",
  "/wp-admin",
  "/wp-login.php",
];

/**
 * Composite Link component combining Next.js navigation with automatic
 * top route progress bar triggering from `@vercel/react-transition-progress`.
 *
 * For native WordPress/WooCommerce routes (/my-account, /checkout, etc.),
 * this automatically falls back to native <a> tags to bypass Next.js client-side
 * SPA routing and allow Traefik to route directly to WordPress.
 */
export function Link({ href, prefetch, onClick, children, ...props }: LinkProps) {
  const startProgress = useProgress();

  const hrefString = typeof href === "string" ? href : href?.pathname || "";
  const isWpRoute = WP_NATIVE_ROUTES.some((route) => hrefString.startsWith(route));

  if (isWpRoute) {
    return (
      <a
        href={hrefString}
        onClick={onClick}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (onClick) onClick(e);

    // Only start progress bar if event was not prevented and target is an internal app route
    if (
      !e.defaultPrevented &&
      typeof href === "string" &&
      !href.startsWith("http") &&
      !href.startsWith("#") &&
      !href.startsWith("mailto:") &&
      !href.startsWith("tel:")
    ) {
      startProgress();
    }
  };

  return (
    <NextLink href={href} prefetch={prefetch} onClick={handleClick} {...props}>
      {children}
    </NextLink>
  );
}
