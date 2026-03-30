import { CartProvider } from '@/features/cart';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { CheckoutBelowFooter } from '@/components/checkout/CheckoutBelowFooter';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
        <CheckoutBelowFooter />
      </div>
    </CartProvider>
  );
}
