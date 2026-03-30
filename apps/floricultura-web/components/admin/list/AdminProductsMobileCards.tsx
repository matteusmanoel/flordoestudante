'use client';

import Link from 'next/link';
import { formatCurrency } from '@flordoestudante/utils';
import { Badge, DropdownMenuItem } from '@flordoestudante/ui';
import { MediaThumb } from '@/components/shared/MediaThumb';
import { AdminEntityCard } from './AdminEntityCard';
import { AdminRowActionsMenu } from './AdminRowActionsMenu';

export type AdminProductListRow = {
  id: string;
  name: string;
  price: number;
  cover_image_url: string | null;
  is_active: boolean;
  categories?: { name: string } | null;
};

export function AdminProductsMobileCards({ products }: { products: AdminProductListRow[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum produto cadastrado. Clique em &quot;Novo produto&quot; para começar.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((p) => {
        const catName = p.categories?.name;
        return (
          <AdminEntityCard
            key={p.id}
            href={`/admin/produtos/${p.id}`}
            thumb={
              <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
                <MediaThumb
                  src={p.cover_image_url}
                  alt={p.name}
                  fill
                  sizes="56px"
                  imageClassName="object-cover"
                />
              </div>
            }
            title={p.name}
            subtitle={catName ? <span>Categoria: {catName}</span> : undefined}
            badges={
              <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-xs">
                {p.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            }
            meta={<span>{formatCurrency(p.price)}</span>}
            actions={
              <AdminRowActionsMenu>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/produtos/${p.id}`}>Editar</Link>
                </DropdownMenuItem>
              </AdminRowActionsMenu>
            }
          />
        );
      })}
    </div>
  );
}
