'use client';

import { Button, DropdownMenuItem } from '@flordoestudante/ui';
import { togglePlanActive } from '@/features/admin/subscription-actions';
import { useRouter } from 'next/navigation';

export function TogglePlanButton({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();

  async function handleToggle() {
    await togglePlanActive(id, isActive);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle}>
      {isActive ? 'Desativar' : 'Ativar'}
    </Button>
  );
}

export function TogglePlanDropdownItem({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        void (async () => {
          await togglePlanActive(id, isActive);
          router.refresh();
        })();
      }}
    >
      {isActive ? 'Desativar' : 'Ativar'}
    </DropdownMenuItem>
  );
}
