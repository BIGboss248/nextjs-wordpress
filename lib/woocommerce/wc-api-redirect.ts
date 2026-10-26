/**
 * WooCommerce API (`wc-api`) callback routing helpers.
 *
 * Payment gateways send the customer (and server-to-server IPN/webhook calls)
 * back to WooCommerce through `WC()->api_request_url()`, which produces one of:
 *
 * - `/wc-api/<Gateway>/`            (pretty permalinks)
 * - `/index.php/wc-api/<Gateway>/`  (PATHINFO permalinks)
 * - `/?wc-api=<Gateway>`            (plain permalinks / hardcoded gateway URLs)
 *
 * On the shared storefront domain those requests can land on Next.js, which has
 * no such route and answers with a 404 — the gateway callback never reaches
 * WooCommerce and the order is never marked as paid.
 *
 * WooCommerce's `WC_API::handle_api_requests()` reads `$_GET['wc-api']` during
 * `parse_request` regardless of the request path, so the equivalent
 * `/checkout/?wc-api=<Gateway>` URL is processed identically by WordPress and is
 * always routed to WordPress by the `PathPrefix(/checkout)` reverse-proxy rule.
 */

/** Query-string key WooCommerce uses to dispatch `woocommerce_api_<request>` actions. */
export const WC_API_QUERY_KEY = "wc-api";

/** Path on the shared domain that the reverse proxy always forwards to WordPress. */
export const WORDPRESS_CHECKOUT_PATH = "/checkout/";

const WC_API_PATH_PATTERN = /^\/(?:index\.php\/)?wc-api(?:\/(.*?))?\/?$/i;
const LEGACY_REST_PATTERN = /^v[1-3](?:\/|$)/i;
const CHECKOUT_PATH_PATTERN = /^\/checkout(?:\/|$)/i;

/**
 * Extracts the WooCommerce API endpoint name (e.g. `WC_ZPal`) from a request URL.
 *
 * @param url - Incoming request URL.
 * @returns The endpoint name, or `null` when the URL is not a `wc-api` callback.
 */
export function getWcApiEndpoint(url: URL): string | null {
  const pathMatch = url.pathname.match(WC_API_PATH_PATTERN);
  const fromPath = pathMatch?.[1] ? safeDecode(pathMatch[1]) : null;
  const endpoint = fromPath || url.searchParams.get(WC_API_QUERY_KEY);

  if (!endpoint) return null;
  // Legacy WooCommerce REST API (`/wc-api/v1..v3/...`) is not a gateway callback.
  if (fromPath && LEGACY_REST_PATTERN.test(fromPath)) return null;

  return endpoint;
}

/**
 * Resolves where a `wc-api` payment callback must be redirected so WordPress handles it.
 *
 * @param url - Incoming request URL as seen by Next.js.
 * @param wordpressUrl - Optional WordPress base URL. Used only when it lives on a
 *   different host than the storefront (e.g. local development); otherwise a
 *   relative `Location` is returned so scheme and host are preserved behind the proxy.
 * @returns The redirect `Location`, or `null` when no redirect is required.
 */
export function resolveWcApiRedirect(url: URL, wordpressUrl?: string): string | null {
  // Loop guard: `/checkout/*` is already owned by WordPress.
  if (CHECKOUT_PATH_PATTERN.test(url.pathname)) return null;

  const endpoint = getWcApiEndpoint(url);
  if (!endpoint) return null;

  const query = new URLSearchParams();
  query.set(WC_API_QUERY_KEY, endpoint);
  url.searchParams.forEach((value, key) => {
    if (key !== WC_API_QUERY_KEY) query.append(key, value);
  });

  const pathAndQuery = `${WORDPRESS_CHECKOUT_PATH}?${query.toString()}`;
  const wordpressBase = parseExternalBase(url, wordpressUrl);

  return wordpressBase ? `${wordpressBase}${pathAndQuery}` : pathAndQuery;
}

function parseExternalBase(url: URL, wordpressUrl?: string): string | null {
  if (!wordpressUrl) return null;
  try {
    const wp = new URL(wordpressUrl);
    if (wp.host === url.host) return null;
    return `${wp.origin}${wp.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
