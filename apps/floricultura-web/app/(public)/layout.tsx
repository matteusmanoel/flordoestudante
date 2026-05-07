import { CartProvider } from '@/features/cart';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { WhatsAppFAB } from '@/components/shared/WhatsAppFAB';
import { PageTransitionWrapper } from '@/components/shared/PageTransitionWrapper';
import { getCategories } from '@/features/catalog/data';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <PublicHeader categories={categories} />
        <main className="flex-1">
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </main>
        <PublicFooter />
        <WhatsAppFAB />
      </div>
    </CartProvider>
  );
}
