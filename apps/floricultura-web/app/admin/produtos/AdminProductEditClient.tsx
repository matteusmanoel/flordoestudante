'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { AdminProductModal } from './AdminProductModal';

type CategoryRow = { id: string; name: string; slug: string };
type ProductData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  cover_image_url: string;
  category_id?: string;
  short_description?: string | null;
  description?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  product_kind?: string;
  addon_ids?: string[];
  recommended_product_ids?: string[];
};

type Props = {
  product: ProductData;
  categories: CategoryRow[];
  addons: { id: string; name: string }[];
  products: { id: string; name: string }[];
};

export function AdminProductEditClient({ product, categories, addons, products }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      router.push('/admin/produtos');
    }
  }, [open, router]);

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/produtos">← Voltar aos produtos</Link>
        </Button>
      </div>
      <AdminProductModal
        open={open}
        onOpenChange={setOpen}
        product={product}
        categories={categories}
        addons={addons}
        products={products}
        onSuccess={() => {
          setOpen(false);
          router.push('/admin/produtos');
          router.refresh();
        }}
      />
    </>
  );
}
