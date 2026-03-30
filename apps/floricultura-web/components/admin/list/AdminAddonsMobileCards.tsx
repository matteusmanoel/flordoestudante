'use client';

import Link from 'next/link';
import { formatCurrency } from '@flordoestudante/utils';
import { Badge, DropdownMenuItem } from '@flordoestudante/ui';
import { MediaThumb } from '@/components/shared/MediaThumb';
import { AdminEntityCard } from './AdminEntityCard';
import { AdminRowActionsMenu } from './AdminRowActionsMenu';
import { ToggleAddonDropdownItem } from '@/app/admin/complementos/ToggleAddonButton';

export type AdminAddonListRow = {
  id: string;
  name: string;
  addon_category: string;
  price: number;
  cover_image_url: string | null;
  is_active: boolean;
};

export function AdminAddonsMobileCards({ addons }: { addons: AdminAddonListRow[] }) {
  if (addons.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum complemento cadastrado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {addons.map((addon) => (
        <AdminEntityCard
          key={addon.id}
          href={`/admin/complementos/${addon.id}`}
          thumb={
            <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
              <MediaThumb
                src={addon.cover_image_url}
                alt={addon.name}
                fill
                sizes="56px"
                imageClassName="object-cover"
              />
            </div>
          }
          title={addon.name}
          subtitle={<span className="capitalize">{addon.addon_category}</span>}
          badges={
            <Badge variant={addon.is_active ? 'default' : 'secondary'} className="text-xs">
              {addon.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
          }
          meta={<span>{formatCurrency(addon.price)}</span>}
          actions={
            <AdminRowActionsMenu>
              <DropdownMenuItem asChild>
                <Link href={`/admin/complementos/${addon.id}`}>Editar</Link>
              </DropdownMenuItem>
              <ToggleAddonDropdownItem id={addon.id} isActive={addon.is_active} />
            </AdminRowActionsMenu>
          }
        />
      ))}
    </div>
  );
}
