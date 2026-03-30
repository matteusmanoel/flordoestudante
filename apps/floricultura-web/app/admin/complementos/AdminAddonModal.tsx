'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@flordoestudante/ui';
import { AddonForm } from './AddonForm';

type AddonData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  cover_image_url?: string | null;
  addon_category: string;
  is_active: boolean;
  sort_order: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addon: AddonData | null;
  onSuccess: () => void;
};

export function AdminAddonModal({ open, onOpenChange, addon, onSuccess }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{addon?.id ? 'Editar complemento' : 'Novo complemento'}</DialogTitle>
        </DialogHeader>
        <AddonForm
          addon={addon ?? undefined}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
