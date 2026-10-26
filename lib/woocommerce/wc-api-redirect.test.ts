/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { getWcApiEndpoint, resolveWcApiRedirect } from "./wc-api-redirect";
import { middleware } from "@/middleware";

const SHOP = "https://shop.meetjamali.com";

describe("getWcApiEndpoint", () => {
  it.each([
    ["/wc-api/WC_ZPal/", "WC_ZPal"],
    ["/wc-api/WC_ZPal", "WC_ZPal"],
    ["/index.php/wc-api/WC_Gateway_Mellat/", "WC_Gateway_Mellat"],
    ["/?wc-api=wc_idpay", "wc_idpay"],
    ["/some/page/?wc-api=WC_Sep&wc_order=12", "WC_Sep"],
  ])("extracts the endpoint from %s", (path, expected) => {
    expect(getWcApiEndpoint(new URL(path, SHOP))).toBe(expected);
  });

  it.each(["/", "/products", "/wc-api/", "/wc-api/v3/orders", "/?wc-ajax=checkout"])(
    "returns null for %s",
    (path) => {
      expect(getWcApiEndpoint(new URL(path, SHOP))).toBeNull();
    },
  );
});

describe("resolveWcApiRedirect", () => {
  it("rewrites pretty-permalink callbacks to /checkout/?wc-api= keeping the query", () => {
    const url = new URL("/wc-api/WC_ZPal/?wc_order=42&Authority=A1&Status=OK", SHOP);
    expect(resolveWcApiRedirect(url)).toBe(
      "/checkout/?wc-api=WC_ZPal&wc_order=42&Authority=A1&Status=OK",
    );
  });

  it("rewrites plain-permalink callbacks on the root path", () => {
    const url = new URL("/?wc-api=wc_idpay&wc_order=7", SHOP);
    expect(resolveWcApiRedirect(url)).toBe("/checkout/?wc-api=wc_idpay&wc_order=7");
  });

  it("never redirects requests already under /checkout (loop guard)", () => {
    expect(resolveWcApiRedirect(new URL("/checkout/?wc-api=WC_ZPal", SHOP))).toBeNull();
  });

  it("ignores non wc-api requests", () => {
    expect(resolveWcApiRedirect(new URL("/cart", SHOP))).toBeNull();
  });

  it("returns a relative location when WordPress shares the storefront host", () => {
    const url = new URL("/wc-api/WC_ZPal/", SHOP);
    expect(resolveWcApiRedirect(url, SHOP)).toBe("/checkout/?wc-api=WC_ZPal");
  });

  it("targets the WordPress origin when it lives on another host", () => {
    const url = new URL("http://localhost:3000/wc-api/WC_ZPal/?wc_order=3");
    expect(resolveWcApiRedirect(url, "https://shop.local/")).toBe(
      "https://shop.local/checkout/?wc-api=WC_ZPal&wc_order=3",
    );
  });

  it("falls back to a relative location for an invalid WordPress URL", () => {
    const url = new URL("/wc-api/WC_ZPal/", SHOP);
    expect(resolveWcApiRedirect(url, "not a url")).toBe("/checkout/?wc-api=WC_ZPal");
  });
});

describe("middleware", () => {
  const originalWpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_WORDPRESS_URL;
  });
  afterAll(() => {
    process.env.NEXT_PUBLIC_WORDPRESS_URL = originalWpUrl;
  });

  it("issues a method-preserving 307 for POSTed gateway callbacks", () => {
    const res = middleware(
      new NextRequest(`${SHOP}/wc-api/WC_Gateway_Mellat/?wc_order=9`, { method: "POST" }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "/checkout/?wc-api=WC_Gateway_Mellat&wc_order=9",
    );
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("passes through regular storefront requests", () => {
    const res = middleware(new NextRequest(`${SHOP}/products`));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
