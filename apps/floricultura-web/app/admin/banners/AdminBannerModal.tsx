'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@flordoestudante/ui';
import { Button, Input, Label, Textarea } from '@flordoestudante/ui';
import { Switch } from '@flordoestudante/ui';
import { toast } from 'sonner';
import { upsertBanner } from '@/features/admin/banner-actions';
import { resolvePublicImageUrl } from '@/lib/image-url';

type BannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_label: string | null;
  cta_href: string | null;
  is_active: boolean;
  sort_order: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: BannerRow | null;
  onSuccess: () => void;
};

export function AdminBannerModal({ open, onOpenChange, banner, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(banner?.is_active ?? true);
  const [preview, setPreview] = useState<string | null>(banner?.image_url ?? null);

  useEffect(() => {
    if (!open) return;
    setActive(banner?.is_active ?? true);
    setPreview(banner?.image_url ?? null);
  }, [open, banner?.id, banner?.is_active, banner?.image_url]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (o && banner) {
          setActive(banner.is_active);
          setPreview(banner.image_url);
        }
        if (o && !banner) {
          setActive(true);
          setPreview(null);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{banner?.id ? 'Editar banner' : 'Novo banner'}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            const fd = new FormData(e.currentTarget);
            fd.set('is_active', active ? 'true' : 'false');

            const coverInput = e.currentTarget.querySelector<HTMLInputElement>('input[name="image_file"]');
            if (coverInput?.files?.[0]) {
              const file = coverInput.files[0];
              const res = await fetch('/api/upload?bucket=banners', {
                method: 'POST',
                body: (() => {
                  const d = new FormData();
                  d.append('file', file);
                  return d;
                })(),
              });
              const json = await res.json();
              if (json.path) fd.set('image_url', json.path);
              else if (json.url) fd.set('image_url', json.url);
            } else if (banner?.image_url) {
              fd.set('image_url', banner.image_url);
            }

            const result = await upsertBanner(fd);
            setLoading(false);
            if (result.success) {
              toast.success(banner?.id ? 'Banner atualizado.' : 'Banner criado.');
              onOpenChange(false);
              onSuccess();
            } else {
              toast.error(result.message);
            }
          }}
        >
          {banner?.id && <input type="hidden" name="id" value={banner.id} />}

          <div className="space-y-2">
            <Label htmlFor="banner-title">Título</Label>
            <Input id="banner-title" name="title" defaultValue={banner?.title ?? ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner-subtitle">Subtítulo</Label>
            <Textarea id="banner-subtitle" name="subtitle" rows={2} defaultValue={banner?.subtitle ?? ''} />
          </div>
          <div className="space-y-2">
            <Label>Imagem</Label>
            <Input
              name="image_file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                if (f) setPreview(URL.createObjectURL(f));
              }}
            />
            {preview && (
              <div className="relative h-24 w-full max-w-md overflow-hidden rounded border">
                <Image
                  src={
                    preview.startsWith('blob:') || preview.startsWith('data:')
                      ? preview
                      : resolvePublicImageUrl(preview)
                  }
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="400px"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cta_label">Texto do botão</Label>
              <Input id="cta_label" name="cta_label" defaultValue={banner?.cta_label ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta_href">Link do botão</Label>
              <Input id="cta_href" name="cta_href" defaultValue={banner?.cta_href ?? ''} placeholder="/catalogo" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">Ordem</Label>
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              min={0}
              defaultValue={banner?.sort_order ?? 0}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="banner-active">Ativo</Label>
            <Switch id="banner-active" checked={active} onCheckedChange={setActive} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : banner?.id ? 'Atualizar' : 'Criar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
