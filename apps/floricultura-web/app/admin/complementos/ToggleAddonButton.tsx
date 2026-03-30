'use client';

import { Button, DropdownMenuItem } from '@flordoestudante/ui';
import { toggleAddonActive } from '@/features/admin/subscription-actions';
import { useRouter } from 'next/navigation';

export function ToggleAddonButton({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();

  async function handleToggle() {
    await toggleAddonActive(id, isActive);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle}>
      {isActive ? 'Desativar' : 'Ativar'}
    </Button>
  );
}

export function ToggleAddonDropdownItem({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        void (async () => {
          await toggleAddonActive(id, isActive);
          router.refresh();
        })();
      }}
    >
      {isActive ? 'Desativar' : 'Ativar'}
    </DropdownMenuItem>
  );
}
