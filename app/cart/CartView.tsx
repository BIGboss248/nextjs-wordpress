'use client';

import * as React from 'react';
import { useCart } from '@/lib/woocommerce/cart-context';
import { processCheckoutAction } from './actions';
import { getAuthSessionAction } from '../login/actions';
import { Link } from '../components/Link';

export function CartView() {
  const {
    cart,
    itemCount,
    isLoading,
    isMutating,
    error,
    updateQuantity,
    removeItem,
    clearCart,
    checkoutUrl,
  } = useCart();

  const [confirmClear, setConfirmClear] = React.useState<boolean>(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState<boolean>(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = React.useState<boolean>(false);
  const [authSession, setAuthSession] = React.useState<{
    authenticated: boolean;
    name?: string;
    email?: string;
    customerId?: number;
  }>({ authenticated: false });

  const [billing, setBilling] = React.useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address1: '',
    city: 'Tehran',
  });

  React.useEffect(() => {
    getAuthSessionAction().then((res) => {
      if (res.authenticated && res.user) {
        setAuthSession({
          authenticated: true,
          name: res.user.name,
          email: res.user.email,
          customerId: res.customer?.databaseId || res.user.databaseId,
        });

        const custBilling = res.customer?.billing;
        setBilling((prev) => ({
          firstName: prev.firstName || custBilling?.firstName || res.user?.name?.split(' ')[0] || '',
          lastName: prev.lastName || custBilling?.lastName || res.user?.name?.split(' ').slice(1).join(' ') || '',
          phone: prev.phone || custBilling?.phone || '',
          email: prev.email || custBilling?.email || res.user?.email || '',
          address1: prev.address1 || custBilling?.address1 || '',
          city: prev.city || custBilling?.city || 'Tehran',
        }));
      }
    });
  }, []);

  const handleProceedToCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await processCheckoutAction({
        billing: billing.firstName || billing.email ? billing : undefined,
        paymentMethod: 'WC_ZPal',
      });

      if (res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        setCheckoutError(res.error || 'Failed to prepare WooCommerce checkout.');
        setIsCheckingOut(false);
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : String(err));
      setIsCheckingOut(false);
    }
  };

  const items = cart?.contents?.nodes || [];
  const isEmpty = !isLoading && (cart?.isEmpty || items.length === 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/products"
              className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1"
            >
              ← Continue Shopping
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time session synchronized with WooCommerce via WooGraphQL.
          </p>
        </div>

        {/* Live Session Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-muted">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isMutating
                ? 'bg-amber-500 animate-pulse'
                : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span>
            {isMutating
              ? 'Updating Session...'
              : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} in cart`}
          </span>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !cart && (
        <div className="rounded-xl border border-border bg-card p-12 text-center space-y-4">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading your cart session...</p>
        </div>
      )}

      {/* Empty Cart State */}
      {isEmpty && (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border bg-card space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <svg
              className="h-8 w-8 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Your Cart is Empty</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            You don&apos;t have any products in your cart yet. Explore our store catalog to find items you like.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
            >
              Browse Store Catalog →
            </Link>
          </div>
        </div>
      )}

      {/* Cart Content (Items + Summary) */}
      {!isEmpty && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/40 font-semibold text-sm flex items-center justify-between">
                <span>Items ({items.length})</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Unit Price / Line Total
                </span>
              </div>

              <div className="divide-y divide-border">
                {items.map((item) => {
                  const product = item.product?.node;
                  const imageSrc = product?.image?.sourceUrl;
                  const isUpdating = isMutating;

                  return (
                    <div
                      key={item.key}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-muted/20"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {imageSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageSrc}
                              alt={product?.image?.altText || product?.name || 'Product'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">No img</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className="font-semibold text-base leading-snug">
                            {product?.name || 'Product'}
                          </h3>
                          <p className="text-xs text-muted-foreground font-mono">
                            Price: {product?.price || '—'}
                          </p>
                        </div>
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-border rounded-md bg-muted/30 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            disabled={isUpdating}
                            className="px-2.5 py-1 text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="px-3 text-sm font-bold w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            disabled={isUpdating}
                            className="px-2.5 py-1 text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right min-w-[5rem]">
                          <span className="text-base font-bold text-foreground block">
                            {item.total || item.subtotal}
                          </span>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          disabled={isUpdating}
                          className="p-1.5 text-muted-foreground hover:text-rose-500 transition disabled:opacity-40"
                          title="Remove item"
                          aria-label={`Remove ${product?.name} from cart`}
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
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clear Cart Trigger */}
            <div className="flex justify-end">
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Are you sure?</span>
                  <button
                    type="button"
                    onClick={() => {
                      clearCart();
                      setConfirmClear(false);
                    }}
                    disabled={isMutating}
                    className="rounded-md bg-rose-600 text-white px-3 py-1 text-xs font-semibold hover:bg-rose-700 transition"
                  >
                    Yes, Clear Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  disabled={isMutating}
                  className="text-xs text-muted-foreground hover:text-rose-500 transition underline"
                >
                  Clear all items from cart
                </button>
              )}
            </div>
          </div>

          {/* Order Summary & Checkout Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-bold border-b border-border pb-3">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {cart?.subtotal || 'ریال0'}
                  </span>
                </div>

                {cart?.discountTotal && cart.discountTotal !== 'ریال0' && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount</span>
                    <span className="font-semibold">-{cart.discountTotal}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-muted-foreground text-xs pt-1">
                  <span>Shipping & Taxes</span>
                  <span>Calculated at Checkout</span>
                </div>

                <div className="border-t border-border pt-4 flex items-center justify-between text-base font-bold">
                  <span>Estimated Total</span>
                  <span className="text-xl text-primary">{cart?.total || 'ریال0'}</span>
                </div>
              </div>

              {/* Customer Account Indicator */}
              {authSession.authenticated ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Signed in as <strong>{authSession.name}</strong></span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">Customer #{authSession.customerId}</span>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between text-amber-800 dark:text-amber-300">
                  <span>💡 Guest Session</span>
                  <Link href="/login" className="font-semibold underline hover:opacity-80">
                    Sign in to track orders →
                  </Link>
                </div>
              )}

              {/* Checkout Error Alert */}
              {checkoutError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                  <p className="font-semibold">⚠️ Checkout Notice:</p>
                  <p>{checkoutError}</p>
                </div>
              )}

              {/* Optional Guest Billing Details Accordion */}
              <div className="border border-border rounded-lg p-3 text-xs space-y-3 bg-muted/20">
                <button
                  type="button"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground font-medium"
                >
                  <span>📝 Customer &amp; Address Details {showAddressForm ? '(Collapse)' : '(Optional)'}</span>
                  <span>{showAddressForm ? '▲' : '▼'}</span>
                </button>

                {showAddressForm && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="First Name"
                        value={billing.firstName}
                        onChange={(e) => setBilling({ ...billing, firstName: e.target.value })}
                        className="p-1.5 rounded border border-border bg-background text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={billing.lastName}
                        onChange={(e) => setBilling({ ...billing, lastName: e.target.value })}
                        className="p-1.5 rounded border border-border bg-background text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        placeholder="Mobile Phone"
                        value={billing.phone}
                        onChange={(e) => setBilling({ ...billing, phone: e.target.value })}
                        className="p-1.5 rounded border border-border bg-background text-xs"
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={billing.email}
                        onChange={(e) => setBilling({ ...billing, email: e.target.value })}
                        className="p-1.5 rounded border border-border bg-background text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={billing.address1}
                      onChange={(e) => setBilling({ ...billing, address1: e.target.value })}
                      className="w-full p-1.5 rounded border border-border bg-background text-xs"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={billing.city}
                      onChange={(e) => setBilling({ ...billing, city: e.target.value })}
                      className="w-full p-1.5 rounded border border-border bg-background text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Native Checkout & Transfer Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => handleProceedToCheckout()}
                  disabled={isCheckingOut || isMutating || isEmpty}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-50 text-center cursor-pointer"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                      <span>Transferring Cart to WooCommerce...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Native Checkout</span>
                      <svg
                        className="w-4 h-4 stroke-current"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </>
                  )}
                </button>

                {/* Direct Pre-populated Cart Link */}
                <div className="text-center pt-1">
                  <a
                    href={checkoutUrl}
                    className="text-xs text-muted-foreground hover:text-foreground underline transition"
                    title="Pre-populate native WooCommerce cart directly"
                  >
                    Or open native WooCommerce cart directly →
                  </a>
                </div>

                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  Creates an order from your Next.js cart session and redirects to WooCommerce native checkout to process payments and shipping securely.
                </p>
              </div>
            </div>

            {/* Security / Feature Banner */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <span>🛡️</span>
                <span>Session Persistence</span>
              </div>
              <p>
                Your cart session is tracked via secure <code>wc_session</code> cookies and linked with your customer account upon login.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
