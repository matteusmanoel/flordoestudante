import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug } from '@/features/catalog/data';
import { ProductGallery, ProductSummary } from '@/features/catalog/components';
import { Button } from '@flordoestudante/ui';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: 'Produto não encontrado — Flor do Estudante' };
  }
  return {
    title: `${product.name} — Flor do Estudante`,
    description: product.shortDescription ?? product.description ?? `Confira ${product.name} no catálogo.`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="container px-4">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/catalogo">← Voltar ao catálogo</Link>
          </Button>
        </div>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <ProductGallery product={product} />
            <ProductSummary product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
