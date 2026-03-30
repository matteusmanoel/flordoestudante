'use client';

import { useState } from 'react';
import { Button } from '@flordoestudante/ui';
import { useRouter } from 'next/navigation';
import { AdminProductModal } from './AdminProductModal';

type CategoryRow = { id: string; name: string; slug: string };

type Props = {
  categories: CategoryRow[];
  addons: { id: string; name: string }[];
  products: { id: string; name: string }[];
};

export function AdminProductsClient({ categories, addons, products }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button size="sm" onClick={() => setModalOpen(true)}>
        Novo produto
      </Button>
      <AdminProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={null}
        categories={categories}
        addons={addons}
        products={products}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
