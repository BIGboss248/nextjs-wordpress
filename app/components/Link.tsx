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

/**
 * Composite Link component combining Next.js navigation with automatic
 * top route progress bar triggering from `@vercel/react-transition-progress`.
 */
export function Link({ href, prefetch, onClick, children, ...props }: LinkProps) {
  const startProgress = useProgress();

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
