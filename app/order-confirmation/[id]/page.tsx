import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '../../components/Link';
import { getOrderDetailsAction } from '../../cart/actions';

export const metadata: Metadata = {
  title: 'Order Confirmation | Next.js WooCommerce',
  description: 'Your order details and confirmation from WooCommerce',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { key } = await searchParams;

  const res = await getOrderDetailsAction(id);
  const order = res.data;

  if (!order) {
    return (
      <main className="min-h-[70vh] bg-background text-foreground py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Order Details Pending</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Order #{id} was registered with WooCommerce. If you just completed payment, your payment confirmation is being verified by the gateway.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 transition"
            >
              View in Customer Account →
            </Link>
            <Link
              href="/products"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const items = order.lineItems?.nodes || [];

  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground transition">
            Catalog
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Order #{order.orderNumber}</span>
        </div>

        {/* Success Banner Hero */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8 text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
            <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-100">
            Thank you! Your order has been placed.
          </h1>
          <p className="text-sm text-emerald-800 dark:text-emerald-300 max-w-lg mx-auto">
            Order <strong>#{order.orderNumber}</strong> has been received and synchronized with WooCommerce.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-background border border-emerald-500/30 font-mono">
              Status: <span className="font-bold text-emerald-600 dark:text-emerald-400">{order.status}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-background border border-emerald-500/30">
              Date: <strong>{new Date(order.date).toLocaleDateString()}</strong>
            </span>
            {order.paymentMethodTitle && (
              <span className="px-3 py-1 rounded-full bg-background border border-emerald-500/30">
                Payment: <strong>{order.paymentMethodTitle}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Order Items Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/40 font-semibold text-sm flex items-center justify-between">
            <span>Ordered Products ({items.length})</span>
            <span className="text-xs text-muted-foreground font-normal">Line Total</span>
          </div>

          <div className="divide-y divide-border">
            {items.map((item, index) => {
              const product = item.product?.node;
              return (
                <div key={index} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-lg bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {product?.image?.sourceUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image.sourceUrl}
                          alt={product.image.altText || product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Product</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm leading-snug">{product?.name || 'Product'}</h3>
                      <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm">{item.total}</span>
                </div>
              );
            })}
          </div>

          {/* Pricing Summary */}
          <div className="p-5 bg-muted/20 border-t border-border space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">{order.subtotal || order.total}</span>
            </div>
            {order.shippingTotal && (
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{order.shippingTotal}</span>
              </div>
            )}
            {order.discountTotal && order.discountTotal !== 'ریال0' && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span>-{order.discountTotal}</span>
              </div>
            )}
            <div className="pt-2 border-t border-border flex justify-between text-base font-bold">
              <span>Total Paid / Due</span>
              <span className="text-primary text-lg">{order.total}</span>
            </div>
          </div>
        </div>

        {/* Customer Information Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Billing Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-2 text-xs">
            <h3 className="font-bold text-sm text-foreground">Billing Details</h3>
            <p className="font-medium">
              {order.billing?.firstName} {order.billing?.lastName}
            </p>
            {order.billing?.phone && <p className="text-muted-foreground">📞 {order.billing.phone}</p>}
            {order.billing?.email && <p className="text-muted-foreground">✉️ {order.billing.email}</p>}
            {order.billing?.address1 && (
              <p className="text-muted-foreground">
                📍 {order.billing.address1}, {order.billing.city || ''} {order.billing.country || ''}
              </p>
            )}
          </div>

          {/* Account & Tracking Actions */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-sm text-foreground">Track in Account</h3>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                You can review real-time status updates and invoices from your account dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href="/login"
                className="rounded-md bg-primary px-4 py-2 text-center text-xs font-semibold text-primary-foreground shadow hover:opacity-90 transition"
              >
                View Account Orders →
              </Link>
              <Link
                href="/products"
                className="rounded-md border border-border px-4 py-2 text-center text-xs font-medium hover:bg-muted transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
