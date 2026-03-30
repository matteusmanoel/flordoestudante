'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@flordoestudante/ui';
import { PlanForm } from './PlanForm';

type PlanData = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  cover_image_url?: string | null;
  price: number;
  frequency: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanData | null;
  onSuccess: () => void;
};

export function AdminPlanModal({ open, onOpenChange, plan, onSuccess }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan?.id ? 'Editar plano' : 'Novo plano'}</DialogTitle>
        </DialogHeader>
        <PlanForm
          plan={plan ?? undefined}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
