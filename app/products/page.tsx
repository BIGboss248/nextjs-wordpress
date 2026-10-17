import type { Metadata } from 'next';
import { Link } from '../components/Link';
import { CartBadge } from '../components/CartBadge';
import { AddToCartButton } from './AddToCartButton';
import { getProducts } from '@/lib/woocommerce/client';
import { ProductNode } from '@/lib/woocommerce/types';

export const metadata: Metadata = {
  title: 'WooCommerce Products Catalog | Next.js',
  description: 'Live catalog queried from WooCommerce via WPGraphQL & WooGraphQL',
};

// Allow dynamic revalidation or fresh fetch
export const revalidate = 60;

export default async function ProductsPage() {
  const { data, error, endpoint } = await getProducts();
  const products: ProductNode[] = data?.products?.nodes || [];
  const isConnected = !error && data !== null;

  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1"
              >
                ← Back to Home
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              WooCommerce Store Catalog
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Decoupled storefront query powered by WPGraphQL and WooGraphQL.
            </p>
          </div>

          {/* Cart & Connection Status */}
          <div className="flex items-center gap-3">
            <CartBadge />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-muted">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>
                {isConnected ? 'API Connected' : 'Endpoint Pending / Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Diagnostic Panel */}
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Endpoint:</span>
              <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground border border-border">
                {endpoint}
              </code>
            </div>
            <div className="text-muted-foreground">
              Mode: <span className="font-medium text-foreground">React Server Component (ISR)</span>
            </div>
          </div>

          {error && (
            <div className="mt-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-sm space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span>⚠️</span> Connection Notice: {error}
              </p>
              <p className="text-xs text-muted-foreground">
                The Next.js client attempted to connect to your WooCommerce GraphQL endpoint, but no response was received. Follow the checklist below to complete the connection.
              </p>
            </div>
          )}
        </div>

        {/* Content Section: Products Grid or Configuration Guide */}
        {isConnected && products.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Available Products ({products.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const category = product.productCategories?.nodes?.[0]?.name;
                const inStock = product.stockStatus !== 'OUT_OF_STOCK';

                return (
                  <article
                    key={product.id || product.databaseId}
                    className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm transition hover:shadow-md"
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                      {product.image?.sourceUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image.sourceUrl}
                          alt={product.image.altText || product.name}
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <svg
                            className="w-12 h-12 stroke-current opacity-40"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                            />
                          </svg>
                          <span className="text-xs mt-1">No Image</span>
                        </div>
                      )}

                      {/* Stock Badge */}
                      <span
                        className={`absolute top-3 right-3 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm ${
                          inStock
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-rose-500/90 text-white'
                        }`}
                      >
                        {inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                      <div className="space-y-2">
                        {category && (
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {category}
                          </span>
                        )}
                        <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                        {product.shortDescription && (
                          <div
                            className="text-xs text-muted-foreground line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div>
                          <span className="text-xs text-muted-foreground block">Price</span>
                          <span className="text-base font-bold text-foreground">
                            {product.price || 'Contact for price'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          ID: #{product.databaseId}
                        </span>
                      </div>

                      {/* Add to Cart Action */}
                      <div className="pt-2">
                        <AddToCartButton
                          productId={product.databaseId}
                          stockStatus={product.stockStatus}
                          hasPrice={Boolean(product.price)}
                          productName={product.name}
                          productType={product.__typename}
                          variations={product.variations?.nodes}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : isConnected && products.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border bg-card">
            <h3 className="text-lg font-semibold">Store Catalog Empty</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Your WooCommerce GraphQL endpoint is reachable, but returned 0 published products.
              Add products in your WordPress admin panel under <strong>WooCommerce → Products</strong>.
            </p>
          </div>
        ) : (
          /* Guided Checklist when backend is offline or awaiting setup */
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Backend Connection Checklist
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                To stream live WooCommerce data into this Next.js frontend, provide the following details or configure your WordPress instance:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                    1
                  </span>
                  <span>WordPress & GraphQL URL</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Provide your live or local WordPress URL (e.g., <code>https://store.example.com/graphql</code>). Update <code>NEXT_PUBLIC_WORDPRESS_API_URL</code> in <code>.env.development</code>.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                    2
                  </span>
                  <span>Required WordPress Plugins</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ensure both <strong>WPGraphQL</strong> and <strong>WooGraphQL (wp-graphql-woocommerce)</strong> are installed and active.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                    3
                  </span>
                  <span>CORS & Network Permissions</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ensure your WordPress web server permits CORS requests from <code>http://localhost:3000</code> or your production domain.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                    4
                  </span>
                  <span>Authentication (Optional for Catalog)</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Public catalog queries require no credentials. For customer checkout, order history, and cart mutations, <strong>wp-graphql-jwt-authentication</strong> is used.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
