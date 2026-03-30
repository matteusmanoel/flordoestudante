'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { AdminAddonModal } from './AdminAddonModal';

type AddonData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  addon_category: string;
  is_active: boolean;
  sort_order: number;
};

type Props = {
  addon: AddonData;
};

export function AdminAddonEditClient({ addon }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      router.push('/admin/complementos');
    }
  }, [open, router]);

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/complementos">← Voltar aos complementos</Link>
        </Button>
      </div>
      <AdminAddonModal
        open={open}
        onOpenChange={setOpen}
        addon={addon}
        onSuccess={() => {
          setOpen(false);
          router.push('/admin/complementos');
          router.refresh();
        }}
      />
    </>
  );
}
