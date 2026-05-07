'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@flordoestudante/ui';
import { Button, Input, Label, Textarea, Switch, Checkbox } from '@flordoestudante/ui';
import { toast } from 'sonner';
import { upsertProduct, deleteProduct } from '@/features/admin/product-actions';
import { resolvePublicImageUrl } from '@/lib/image-url';
import { PRODUCT_KIND } from '@flordoestudante/core';

type CategoryRow = { id: string; name: string; slug: string };
type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  cover_image_url: string;
  category_id?: string;
  short_description?: string | null;
  description?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  product_kind?: string;
  addon_ids?: string[];
  recommended_product_ids?: string[];
};

type ProductData = ProductRow & {
  addon_ids?: string[];
  recommended_product_ids?: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductData | null;
  categories: CategoryRow[];
  addons: { id: string; name: string }[];
  products: { id: string; name: string }[];
  onSuccess: () => void;
};

export function AdminProductModal({
  open,
  onOpenChange,
  product,
  categories,
  addons,
  products,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(product?.cover_image_url ?? null);
  const [active, setActive] = useState(product?.is_active ?? true);
  const [featured, setFeatured] = useState(product?.is_featured ?? false);
  const [addonIds, setAddonIds] = useState<string[]>(product?.addon_ids ?? []);
  const [recIds, setRecIds] = useState<string[]>(product?.recommended_product_ids ?? []);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }
    setCoverPreview(product?.cover_image_url ?? null);
    setActive(product?.is_active ?? true);
    setFeatured(product?.is_featured ?? false);
    setAddonIds(product?.addon_ids ?? []);
    setRecIds(product?.recommended_product_ids ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set('is_active', active ? 'true' : 'false');
    fd.set('is_featured', featured ? 'true' : 'false');

    addonIds.forEach((id) => fd.append('addon_ids', id));
    recIds.forEach((id) => fd.append('recommended_product_ids', id));

    const coverInput = e.currentTarget.querySelector<HTMLInputElement>('input[name="cover_image_file"]');
    if (coverInput?.files?.[0]) {
      const file = coverInput.files[0];
      const res = await fetch(`/api/upload?bucket=products`, {
        method: 'POST',
        body: (() => {
          const d = new FormData();
          d.append('file', file);
          d.append('productId', product?.id ?? 'new');
          d.append('index', '0');
          return d;
        })(),
      });
      const json = await res.json();
      if (json.path) fd.set('cover_image_url', json.path);
      else if (json.url) fd.set('cover_image_url', json.url);
    } else if (product?.cover_image_url) {
      fd.set('cover_image_url', product.cover_image_url);
    }

    const result = await upsertProduct(fd);
    setLoading(false);
    if (result.success) {
      toast.success(product?.id ? 'Produto atualizado.' : 'Produto criado.');
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.message);
    }
  }

  async function handleDelete() {
    if (!product?.id) return;
    setDeleting(true);
    const result = await deleteProduct(product.id);
    setDeleting(false);
    if (result.success) {
      toast.success('Produto excluído.');
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.message ?? 'Erro ao excluir produto.');
    }
  }

  const filteredProducts = products.filter((p) => p.id !== product?.id);

  function toggleAddon(id: string) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleRec(id: string) {
    setRecIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product?.id ? 'Editar produto' : 'Novo produto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {product?.id && <input type="hidden" name="id" value={product.id} />}

          {/* Confirmação de exclusão */}
          {confirmDelete && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">
                Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
              </p>
              <div className="mt-3 flex gap-3">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Grid 2 colunas: texto | imagem/switches */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Coluna esquerda — campos de texto */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" name="name" key={`name-${product?.id ?? 'new'}`} defaultValue={product?.name ?? ''} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Categoria *</Label>
                <select
                  id="category_id"
                  name="category_id"
                  key={`cat-${product?.id ?? 'new'}`}
                  defaultValue={product?.category_id ?? ''}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price" name="price" type="number" step="0.01" min="0"
                    key={`price-${product?.id ?? 'new'}`}
                    defaultValue={product?.price ?? ''} required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compare_at_price">De (R$)</Label>
                  <Input
                    id="compare_at_price" name="compare_at_price" type="number" step="0.01" min="0"
                    key={`compare-${product?.id ?? 'new'}`}
                    defaultValue={product?.compare_at_price ?? ''}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Descrição curta</Label>
                <Input
                  id="short_description" name="short_description"
                  key={`short-${product?.id ?? 'new'}`}
                  defaultValue={product?.short_description ?? ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição completa</Label>
                <Textarea
                  id="description" name="description" rows={4}
                  key={`desc-${product?.id ?? 'new'}`}
                  defaultValue={product?.description ?? ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_kind">Tipo</Label>
                <select
                  id="product_kind" name="product_kind"
                  key={`kind-${product?.id ?? 'new'}`}
                  defaultValue={product?.product_kind ?? PRODUCT_KIND.REGULAR}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={PRODUCT_KIND.REGULAR}>Regular</option>
                  <option value={PRODUCT_KIND.CUSTOMIZABLE}>Customizável</option>
                </select>
              </div>
            </div>

            {/* Coluna direita — imagem, switches, relações */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Imagem de capa</Label>
                <Input
                  name="cover_image_file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setCoverPreview(URL.createObjectURL(f));
                  }}
                />
                {coverPreview && (
                  <div className="relative h-32 w-full overflow-hidden rounded-lg border">
                    <Image
                      src={
                        coverPreview.startsWith('blob:') || coverPreview.startsWith('data:')
                          ? coverPreview
                          : resolvePublicImageUrl(coverPreview)
                      }
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="300px"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sw-active">Ativo</Label>
                  <Switch id="sw-active" checked={active} onCheckedChange={setActive} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sw-featured">Destaque</Label>
                  <Switch id="sw-featured" checked={featured} onCheckedChange={setFeatured} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Complementos (add-ons)</Label>
                <p className="text-xs text-muted-foreground">Adicionados junto ao produto no pedido.</p>
                <div className="max-h-28 space-y-2 overflow-y-auto rounded border p-2">
                  {addons.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={addonIds.includes(a.id)} onCheckedChange={() => toggleAddon(a.id)} />
                      {a.name}
                    </label>
                  ))}
                  {addons.length === 0 && <p className="text-xs text-muted-foreground">Nenhum complemento.</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Produtos recomendados</Label>
                <p className="text-xs text-muted-foreground">Aparecem em &quot;Complete seu presente&quot;.</p>
                <div className="max-h-28 space-y-2 overflow-y-auto rounded border p-2">
                  {filteredProducts.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={recIds.includes(p.id)} onCheckedChange={() => toggleRec(p.id)} />
                      {p.name}
                    </label>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum produto para vincular.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer com ações */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            {product?.id && !confirmDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                Excluir produto
              </Button>
            )}
            {!product?.id && <div />}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : product?.id ? 'Atualizar' : 'Criar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
