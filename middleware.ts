import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveWcApiRedirect } from "@/lib/woocommerce/wc-api-redirect";

export function middleware(request: NextRequest) {
  const target = resolveWcApiRedirect(
    new URL(request.url),
    process.env.NEXT_PUBLIC_WORDPRESS_URL
  );

  if (target) {
    return new NextResponse(null, {
      status: 307,
      headers: {
        Location: target,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
