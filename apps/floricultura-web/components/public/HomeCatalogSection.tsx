import Link from 'next/link';
import { getProductsByCategory } from '@/features/catalog/data';
import { CategoryCarouselSection } from '@/features/catalog/components';
import { Button } from '@flordoestudante/ui';

const HOME_CATEGORY_ORDER = [
  'girassois',
  'rosas',
  'cestas',
  'pelucias',
  'velas-e-presentes',
  'chocolates',
  'complementos',
  'condolencias',
] as const;

export async function HomeCatalogSection() {
  const rawSections = await getProductsByCategory({ limitPerCategory: 10 });
  const orderMap = new Map<string, number>(HOME_CATEGORY_ORDER.map((slug, index) => [slug, index]));
  const categorySections = rawSections
    .filter(({ category }) => orderMap.has(category.slug))
    .sort(
      (a, b) =>
        (orderMap.get(a.category.slug) ?? Number.MAX_SAFE_INTEGER) -
        (orderMap.get(b.category.slug) ?? Number.MAX_SAFE_INTEGER)
    );

  if (categorySections.length === 0) {
    return (
      <section id="destaques" className="section-divider py-16 sm:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="editorial-label">Catálogo</p>
            <h2 className="mt-2 font-display text-2xl font-medium text-foreground sm:text-3xl">
              Flores e presentes
            </h2>
            <p className="mt-3 text-muted-foreground">
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
    <section id="destaques" className="section-divider py-16 sm:py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="editorial-label">Catálogo</p>
          <h2 className="mt-2 font-display text-2xl font-medium text-foreground sm:text-3xl">
            Flores e presentes para todos os momentos
          </h2>
        </div>

        <div className="mt-12 space-y-14">
          {categorySections.map(({ category, products }) => (
            <CategoryCarouselSection
              key={category.id}
              category={category}
              products={products}
            />
          ))}
        </div>

        <div className="mt-12 flex justify-center px-4">
          <Button asChild variant="outline" size="lg">
            <Link href="/catalogo">Ver todo o catálogo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
