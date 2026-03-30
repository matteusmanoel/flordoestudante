'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Input, Label, Textarea, Switch } from '@flordoestudante/ui';
import { upsertAddon } from '@/features/admin/subscription-actions';
import { resolvePublicImageUrl } from '@/lib/image-url';

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

type AddonFormProps = { addon?: AddonData; onSuccess?: () => void };

export function AddonForm({ addon, onSuccess }: AddonFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(addon?.is_active ?? true);
  const [coverPreview, setCoverPreview] = useState<string | null>(addon?.cover_image_url ?? null);

  useEffect(() => {
    setActive(addon?.is_active ?? true);
    setCoverPreview(addon?.cover_image_url ?? null);
  }, [addon?.id, addon?.is_active, addon?.cover_image_url]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('is_active', active ? 'true' : 'false');

    const fileInput = e.currentTarget.querySelector<HTMLInputElement>('input[name="cover_file"]');
    if (fileInput?.files?.[0]) {
      const file = fileInput.files[0];
      const uploadFd = new FormData();
      uploadFd.append('file', file);
      uploadFd.append('addonId', addon?.id ?? 'new');
      const res = await fetch('/api/upload?bucket=addons', { method: 'POST', body: uploadFd });
      const json = await res.json();
      if (json.path) fd.set('cover_image_url', json.path);
      else if (json.url) fd.set('cover_image_url', json.url);
    } else if (addon?.cover_image_url) {
      fd.set('cover_image_url', addon.cover_image_url);
    }

    const result = await upsertAddon(fd);
    setLoading(false);
    if (result.success) {
      toast.success(result.message ?? 'Complemento salvo com sucesso.');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/complementos');
        router.refresh();
      }
    } else {
      const msg = result.message ?? 'Erro ao salvar.';
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {addon?.id && <input type="hidden" name="id" value={addon.id} />}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={addon?.name ?? ''} required />
      </div>

      <div className="space-y-2">
        <Label>Imagem</Label>
        <Input
          name="cover_file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            if (f) setCoverPreview(URL.createObjectURL(f));
          }}
        />
        {coverPreview && (
          <div className="relative h-24 w-24 overflow-hidden rounded border">
            <Image
              src={
                coverPreview.startsWith('blob:') || coverPreview.startsWith('data:')
                  ? coverPreview
                  : resolvePublicImageUrl(coverPreview)
              }
              alt=""
              fill
              className="object-cover"
              unoptimized
              sizes="96px"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={addon?.description ?? ''} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={addon?.price ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addon_category">Categoria</Label>
          <select
            id="addon_category"
            name="addon_category"
            defaultValue={addon?.addon_category ?? 'gift'}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
          >
            <option value="chocolate">Chocolate</option>
            <option value="card">Cartão</option>
            <option value="drink">Bebida</option>
            <option value="gift">Presente</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sort_order">Ordem</Label>
          <Input id="sort_order" name="sort_order" type="number" min="0" defaultValue={addon?.sort_order ?? 0} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="addon-active">Ativo</Label>
          <Switch id="addon-active" checked={active} onCheckedChange={setActive} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : addon?.id ? 'Atualizar' : 'Criar complemento'}
        </Button>
        {!onSuccess && (
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
