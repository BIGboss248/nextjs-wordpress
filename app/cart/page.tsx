import type { Metadata } from 'next';
import { CartView } from './CartView';

export const metadata: Metadata = {
  title: 'Shopping Cart | Next.js WooCommerce',
  description: 'Manage items in your shopping cart and proceed to checkout',
};

// Force dynamic evaluation so cookies and sessions are evaluated per request
export const dynamic = 'force-dynamic';

export default function CartPage() {
  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <CartView />
    </main>
  );
}
