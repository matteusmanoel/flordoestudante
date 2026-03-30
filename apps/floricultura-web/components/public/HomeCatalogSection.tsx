import Link from 'next/link';
import { getCategories, getFeaturedProducts } from '@/features/catalog/data';
import {
  CategoryChip,
  ProductGrid,
} from '@/features/catalog/components';
import { Button } from '@flordoestudante/ui';

export async function HomeCatalogSection() {
  const [categories, featuredProducts] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
  ]);

  const hasCategories = categories.length > 0;
  const hasProducts = featuredProducts.length > 0;
  const isEmpty = !hasCategories && !hasProducts;

  if (isEmpty) {
    return (
      <section id="destaques" className="border-b border-border/60 bg-gradient-to-b from-emerald-50/30 via-background to-green-50/20 py-16 sm:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
              Destaques
            </h2>
            <p className="mt-2 text-muted-foreground">
              Em breve: buquês, cestas e presentes para você escolher.
            </p>
          </div>
          <div className="mt-10 flex justify-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/catalogo">Ver catálogo</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="destaques" className="border-b border-border/60 bg-gradient-to-b from-emerald-50/30 via-background to-green-50/20 py-16 sm:py-24">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
            Destaques
          </h2>
          <p className="mt-2 text-muted-foreground">
            Flores, buquês e presentes para todos os momentos.
          </p>
        </div>
        {hasCategories && (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {categories.slice(0, 6).map((cat) => (
              <CategoryChip key={cat.id} category={cat} />
            ))}
          </div>
        )}
        {hasProducts ? (
          <div className="mt-10">
            <ProductGrid products={featuredProducts} />
            <div className="mt-10 flex justify-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/catalogo">Ver todo o catálogo</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-10 flex justify-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/catalogo">Ver catálogo</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
