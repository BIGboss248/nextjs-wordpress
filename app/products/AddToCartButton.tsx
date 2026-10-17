'use client';

import * as React from 'react';
import { useCart } from '@/lib/woocommerce/cart-context';
import { Link } from '../components/Link';

import { ProductVariationNode } from '@/lib/woocommerce/types';

interface AddToCartButtonProps {
  productId: number;
  stockStatus?: string | null;
  hasPrice: boolean;
  productName?: string;
  productType?: string;
  variations?: ProductVariationNode[];
}

export function AddToCartButton({
  productId,
  stockStatus,
  hasPrice,
  productName = 'Product',
  productType = 'SimpleProduct',
  variations = [],
}: AddToCartButtonProps) {
  const { addToCart, isMutating } = useCart();
  const [quantity, setQuantity] = React.useState<number>(1);
  const [selectedVariationId, setSelectedVariationId] = React.useState<number | undefined>(() => {
    if (variations && variations.length > 0) {
      const inStock = variations.find((v) => v.stockStatus !== 'OUT_OF_STOCK');
      return inStock ? inStock.databaseId : variations[0].databaseId;
    }
    return undefined;
  });
  const [loading, setLoading] = React.useState<boolean>(false);
  const [added, setAdded] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const isVariable = productType === 'VariableProduct';
  const isExternal = productType === 'ExternalProduct';
  const isGrouped = productType === 'GroupedProduct';

  const selectedVariation = variations?.find((v) => v.databaseId === selectedVariationId);
  const isOutOfStock = isVariable
    ? selectedVariation?.stockStatus === 'OUT_OF_STOCK'
    : stockStatus === 'OUT_OF_STOCK';

  const isPurchasable = !isExternal && !isGrouped && hasPrice && !isOutOfStock;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isPurchasable || loading || isMutating) return;

    setLoading(true);
    setErrorMessage(null);

    const res = await addToCart(productId, quantity, isVariable ? selectedVariationId : undefined);

    setLoading(false);
    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to add to cart');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  if (isExternal) {
    return (
      <button
        disabled
        className="w-full rounded-md border border-border bg-muted/60 px-4 py-2 text-xs font-semibold text-muted-foreground cursor-not-allowed opacity-75"
      >
        External Product
      </button>
    );
  }

  if (isGrouped) {
    return (
      <button
        disabled
        className="w-full rounded-md border border-border bg-muted/60 px-4 py-2 text-xs font-semibold text-muted-foreground cursor-not-allowed opacity-75"
      >
        Grouped Product
      </button>
    );
  }

  if (!isPurchasable) {
    return (
      <button
        disabled
        className="w-full rounded-md border border-border bg-muted/60 px-4 py-2 text-xs font-semibold text-muted-foreground cursor-not-allowed opacity-75"
        title={isOutOfStock ? 'Item is out of stock' : 'Product pricing unavailable'}
      >
        {isOutOfStock ? 'Out of Stock' : 'Unavailable'}
      </button>
    );
  }

  return (
    <div className="w-full space-y-2">
      {/* Variation Selector for Variable Products */}
      {isVariable && variations && variations.length > 0 && (
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground block">
            Options:
          </label>
          <select
            value={selectedVariationId}
            onChange={(e) => setSelectedVariationId(Number(e.target.value))}
            disabled={loading || isMutating}
            className="w-full text-xs rounded-md border border-border bg-card px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {variations.map((v) => (
              <option key={v.id || v.databaseId} value={v.databaseId}>
                {v.name.replace(`${productName} - `, '')} {v.price ? `(${v.price})` : ''}{' '}
                {v.stockStatus === 'OUT_OF_STOCK' ? '[Out of Stock]' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Quantity Selector */}
        <div className="flex items-center border border-border rounded-md bg-muted/30 overflow-hidden">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setQuantity((prev) => Math.max(1, prev - 1));
            }}
            disabled={quantity <= 1 || loading || isMutating}
            className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="px-2 text-xs font-bold w-6 text-center">{quantity}</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setQuantity((prev) => prev + 1);
            }}
            disabled={loading || isMutating}
            className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition disabled:opacity-40"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={loading || isMutating}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60'
          }`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-3.5 w-3.5 text-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span>Adding...</span>
            </>
          ) : added ? (
            <>
              <span>✓ Added</span>
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>

      {/* Added Confirmation & View Cart Link */}
      {added && (
        <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-1">
          <span>Added to cart!</span>
          <Link
            href="/cart"
            className="underline hover:text-foreground transition"
          >
            View Cart →
          </Link>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium px-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
