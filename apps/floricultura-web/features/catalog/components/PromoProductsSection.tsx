import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { ProductGrid } from './ProductGrid';
import type { ProductCardModel } from '../types';

type PromoProductsSectionProps = {
  products: ProductCardModel[];
  title?: string;
  description?: string;
  showCatalogLink?: boolean;
  className?: string;
};

export function PromoProductsSection({
  products,
  title = 'Promoções',
  description = 'Ofertas por tempo limitado no catálogo.',
  showCatalogLink = false,
  className,
}: PromoProductsSectionProps) {
  if (products.length === 0) return null;

  return (
    <div className={className}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
      </div>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
      {showCatalogLink ? (
        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/catalogo">Ver catálogo completo</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
