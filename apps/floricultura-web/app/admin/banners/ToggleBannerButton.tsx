'use client';

import { Button, DropdownMenuItem } from '@flordoestudante/ui';
import { toggleBannerActive } from '@/features/admin/banner-actions';
import { useRouter } from 'next/navigation';

export function ToggleBannerButton({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();

  async function handleToggle() {
    await toggleBannerActive(id, isActive);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle}>
      {isActive ? 'Desativar' : 'Ativar'}
    </Button>
  );
}

export function ToggleBannerDropdownItem({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        void (async () => {
          await toggleBannerActive(id, isActive);
          router.refresh();
        })();
      }}
    >
      {isActive ? 'Desativar' : 'Ativar'}
    </DropdownMenuItem>
  );
}
