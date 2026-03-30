'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { AdminPlanModal } from './AdminPlanModal';

type PlanData = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number;
  frequency: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

type Props = {
  plan: PlanData;
};

export function AdminPlanEditClient({ plan }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      router.push('/admin/planos');
    }
  }, [open, router]);

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/planos">← Voltar aos planos</Link>
        </Button>
      </div>
      <AdminPlanModal
        open={open}
        onOpenChange={setOpen}
        plan={plan}
        onSuccess={() => {
          setOpen(false);
          router.push('/admin/planos');
          router.refresh();
        }}
      />
    </>
  );
}
