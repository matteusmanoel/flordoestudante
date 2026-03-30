'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@flordoestudante/ui';
import { AdminAddonModal } from './AdminAddonModal';

export function AdminAddonsClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button size="sm" onClick={() => setModalOpen(true)}>
        Novo complemento
      </Button>
      <AdminAddonModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        addon={null}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
