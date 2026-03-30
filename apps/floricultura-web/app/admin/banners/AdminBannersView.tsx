'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button, DropdownMenuItem } from '@flordoestudante/ui';
import { AdminBannerModal } from './AdminBannerModal';
import { ToggleBannerButton, ToggleBannerDropdownItem } from './ToggleBannerButton';
import { deleteBanner } from '@/features/admin/banner-actions';
import { toast } from 'sonner';
import { MediaThumb } from '@/components/shared/MediaThumb';
import { AdminEntityCard, AdminRowActionsMenu } from '@/components/admin/list';

export type BannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_label: string | null;
  cta_href: string | null;
  is_active: boolean;
  sort_order: number;
};

export function AdminBannersView({ banners }: { banners: BannerRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-medium">Banners</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          Novo banner
        </Button>
      </div>

      <AdminBannerModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setEditing(null);
        }}
        banner={editing}
        onSuccess={() => router.refresh()}
      />

      <div className="md:hidden space-y-3">
        {banners.map((b) => (
          <AdminEntityCard
            key={b.id}
            thumb={
              <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                <MediaThumb
                  src={b.image_url}
                  alt={b.title}
                  fill
                  sizes="112px"
                  imageClassName="object-cover"
                />
              </div>
            }
            title={b.title}
            subtitle={b.subtitle ? <span className="line-clamp-2">{b.subtitle}</span> : undefined}
            badges={
              <>
                <Badge variant="outline" className="text-xs">
                  Ordem {b.sort_order}
                </Badge>
                <Badge variant={b.is_active ? 'default' : 'secondary'} className="text-xs">
                  {b.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </>
            }
            actions={
              <AdminRowActionsMenu>
                <DropdownMenuItem
                  onSelect={() => {
                    setEditing(b);
                    setModalOpen(true);
                  }}
                >
                  Editar
                </DropdownMenuItem>
                <ToggleBannerDropdownItem id={b.id} isActive={b.is_active} />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    void (async () => {
                      if (!confirm('Excluir este banner?')) return;
                      const r = await deleteBanner(b.id);
                      if (r.success) {
                        toast.success('Banner removido.');
                        router.refresh();
                      } else toast.error(r.message);
                    })();
                  }}
                >
                  Excluir
                </DropdownMenuItem>
              </AdminRowActionsMenu>
            }
          />
        ))}
        {banners.length === 0 && (
          <p className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum banner. Clique em &quot;Novo banner&quot;.
          </p>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Imagem</th>
              <th className="px-4 py-3 text-left font-medium">Título</th>
              <th className="px-4 py-3 text-center font-medium">Ordem</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {banners.map((b) => (
              <tr key={b.id} className="hover:bg-muted/30">
                <td className="px-4 py-2">
                  <div className="relative h-12 w-20 overflow-hidden rounded bg-muted">
                    <MediaThumb
                      src={b.image_url}
                      alt={b.title}
                      fill
                      sizes="80px"
                      imageClassName="object-cover"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{b.title}</div>
                  {b.subtitle && <div className="text-xs text-muted-foreground line-clamp-1">{b.subtitle}</div>}
                </td>
                <td className="px-4 py-3 text-center">{b.sort_order}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={b.is_active ? 'default' : 'secondary'}>
                    {b.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(b);
                        setModalOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <ToggleBannerButton id={b.id} isActive={b.is_active} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!confirm('Excluir este banner?')) return;
                        const r = await deleteBanner(b.id);
                        if (r.success) {
                          toast.success('Banner removido.');
                          router.refresh();
                        } else toast.error(r.message);
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum banner. Clique em &quot;Novo banner&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Button asChild variant="ghost" size="sm">
        <Link href="/admin">← Início do painel</Link>
      </Button>
    </div>
  );
}
