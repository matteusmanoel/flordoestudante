'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@flordoestudante/ui';
import { AdminPlanModal } from './AdminPlanModal';

export function AdminPlansClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button size="sm" onClick={() => setModalOpen(true)}>
        Novo plano
      </Button>
      <AdminPlanModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        plan={null}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
