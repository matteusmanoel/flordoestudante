'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Input, Label, Textarea, Switch } from '@flordoestudante/ui';
import { upsertSubscriptionPlan } from '@/features/admin/subscription-actions';
import { resolvePublicImageUrl } from '@/lib/image-url';
import { SUBSCRIPTION_FREQUENCY } from '@flordoestudante/core';

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

type PlanFormProps = { plan?: PlanData; onSuccess?: () => void };

export function PlanForm({ plan, onSuccess }: PlanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(plan?.is_active ?? true);
  const [featured, setFeatured] = useState(plan?.is_featured ?? false);
  const [coverPreview, setCoverPreview] = useState<string | null>(plan?.cover_image_url ?? null);

  useEffect(() => {
    setActive(plan?.is_active ?? true);
    setFeatured(plan?.is_featured ?? false);
    setCoverPreview(plan?.cover_image_url ?? null);
  }, [plan?.id, plan?.is_active, plan?.is_featured, plan?.cover_image_url]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('is_active', active ? 'true' : 'false');
    fd.set('is_featured', featured ? 'true' : 'false');

    const fileInput = e.currentTarget.querySelector<HTMLInputElement>('input[name="cover_file"]');
    if (fileInput?.files?.[0]) {
      const file = fileInput.files[0];
      const uploadFd = new FormData();
      uploadFd.append('file', file);
      uploadFd.append('planId', plan?.id ?? 'new');
      const res = await fetch('/api/upload?bucket=plans', { method: 'POST', body: uploadFd });
      const json = await res.json();
      if (json.path) fd.set('cover_image_url', json.path);
      else if (json.url) fd.set('cover_image_url', json.url);
    } else if (plan?.cover_image_url) {
      fd.set('cover_image_url', plan.cover_image_url);
    }

    const result = await upsertSubscriptionPlan(fd);
    setLoading(false);
    if (result.success) {
      toast.success(result.message ?? 'Plano salvo com sucesso.');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/planos');
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
      {plan?.id && <input type="hidden" name="id" value={plan.id} />}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={plan?.name ?? ''} required />
      </div>

      <div className="space-y-2">
        <Label>Imagem do plano</Label>
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
          <div className="relative h-28 w-full max-w-xs overflow-hidden rounded border">
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
              sizes="256px"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="short_description">Descrição curta</Label>
        <Input id="short_description" name="short_description" defaultValue={plan?.short_description ?? ''} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição completa</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={plan?.description ?? ''} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={plan?.price ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequência</Label>
          <select
            id="frequency"
            name="frequency"
            defaultValue={plan?.frequency ?? SUBSCRIPTION_FREQUENCY.MONTHLY}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
          >
            <option value={SUBSCRIPTION_FREQUENCY.WEEKLY}>Semanal</option>
            <option value={SUBSCRIPTION_FREQUENCY.BIWEEKLY}>Quinzenal</option>
            <option value={SUBSCRIPTION_FREQUENCY.MONTHLY}>Mensal</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sort_order">Ordem</Label>
          <Input id="sort_order" name="sort_order" type="number" min="0" defaultValue={plan?.sort_order ?? 0} />
        </div>
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="plan-active">Ativo</Label>
            <Switch id="plan-active" checked={active} onCheckedChange={setActive} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="plan-featured">Destaque</Label>
            <Switch id="plan-featured" checked={featured} onCheckedChange={setFeatured} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : plan?.id ? 'Atualizar' : 'Criar plano'}
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
