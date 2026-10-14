import { GET_PRODUCTS_QUERY } from './queries';
import { ProductsQueryResult, WooCommerceQueryResult } from './types';

export function getWordPressApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
    'http://localhost:8080/graphql'
  );
}

interface FetchOptions {
  variables?: Record<string, unknown>;
  revalidate?: number | false;
}

/**
 * Universal Next.js fetcher for WooCommerce GraphQL API
 */
export async function fetchWooCommerce<T>(
  query: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: string | null; endpoint: string }> {
  const endpoint = getWordPressApiUrl();

  try {
    const fetchConfig: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: options.variables,
      }),
    };

    if (options.revalidate !== undefined) {
      fetchConfig.next = {
        revalidate: options.revalidate,
      };
    } else {
      fetchConfig.cache = 'no-store';
    }

    const res = await fetch(endpoint, fetchConfig);

    if (!res.ok) {
      return {
        data: null,
        error: `HTTP ${res.status}: ${res.statusText}`,
        endpoint,
      };
    }

    const json = await res.json();

    if (json.errors && json.errors.length > 0) {
      return {
        data: null,
        error: json.errors.map((e: { message: string }) => e.message).join(' | '),
        endpoint,
      };
    }

    return {
      data: json.data as T,
      error: null,
      endpoint,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      data: null,
      error: message,
      endpoint,
    };
  }
}

/**
 * Fetch public catalog products
 */
export async function getProducts(first = 20): Promise<WooCommerceQueryResult<ProductsQueryResult>> {
  const res = await fetchWooCommerce<ProductsQueryResult>(GET_PRODUCTS_QUERY, {
    variables: { first },
    revalidate: 60, // ISR revalidation
  });

  return {
    data: res.data,
    error: res.error,
    endpoint: res.endpoint,
  };
}
