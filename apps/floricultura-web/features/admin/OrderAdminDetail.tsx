'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@flordoestudante/ui';
import { Input } from '@flordoestudante/ui';
import { Label } from '@flordoestudante/ui';
import { Textarea } from '@flordoestudante/ui';
import { Badge } from '@flordoestudante/ui';
import { cn } from '@flordoestudante/utils';
import { ORDER_STATUS, ORDER_STATUS_LABELS, type OrderStatus } from '@flordoestudante/core';
import { formatCurrency } from '@flordoestudante/utils';
import { MessageCircle, Link2, Copy, Check } from 'lucide-react';
import { getWhatsAppUrl } from '@flordoestudante/notifications';
import { STORE_NAME } from '@/lib/constants';
import { getSiteUrl } from '@/lib/site-url';
import {
  updateOrderAdminAction,
  setOrderItemQuantityAction,
  replaceOrderItemProductAction,
} from './order-actions';

const STATUS_OPTIONS = Object.values(ORDER_STATUS) as OrderStatus[];

type Item = {
  id: string;
  product_name_snapshot: string;
  unit_price_snapshot: string;
  quantity: number;
  line_total: string;
};

type ProductOpt = { id: string; name: string; price: string };

export function OrderAdminDetail({
  orderId,
  publicCode,
  initialStatus,
  estimatedText,
  adminNote,
  customerName,
  customerPhone,
  items,
  products,
}: {
  orderId: string;
  publicCode: string;
  initialStatus: string;
  estimatedText: string | null;
  adminNote: string | null;
  customerName: string | null;
  customerPhone: string | null;
  items: Item[];
  products: ProductOpt[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  function flash(ok: boolean, text: string) {
    if (ok) {
      setMsg(text);
      setErr(null);
    } else {
      setErr(text);
      setMsg(null);
    }
    router.refresh();
  }

  function handleCopyLink() {
    const url = `${getSiteUrl()}/pedido/${encodeURIComponent(publicCode)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  const statusLabel = ORDER_STATUS_LABELS[initialStatus as OrderStatus] ?? initialStatus;
  const trackingUrl = `${getSiteUrl()}/pedido/${encodeURIComponent(publicCode)}`;
  const whatsappMessage = customerPhone
    ? `Olá! Sobre o pedido *${publicCode}* em ${STORE_NAME}:\n\nStatus: *${statusLabel}*${estimatedText ? `\nPrazo: ${estimatedText}` : ''}\n\nAcompanhe aqui: ${trackingUrl}`
    : '';

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium">{publicCode}</h1>
          <Link
            href={`/pedido/${encodeURIComponent(publicCode)}`}
            className="text-sm text-primary underline-offset-4 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Ver página pública ↗
          </Link>
        </div>
        <Link
          href="/admin/pedidos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Lista
        </Link>
      </div>

      {customerName && (
        <section className="space-y-4 rounded-lg border border-border bg-background p-4">
          <h2 className="font-medium">Cliente</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Nome:</strong> {customerName}
            </p>
            {customerPhone && (
              <p className="text-sm">
                <strong>Telefone:</strong> {customerPhone}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {customerPhone && (
              <Button asChild size="sm" variant="outline">
                <a
                  href={getWhatsAppUrl(customerPhone, whatsappMessage)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Conversar no WhatsApp
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              {copiedLink ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                  Link copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar link de acompanhamento
                </>
              )}
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-lg border border-border bg-background p-4">
        <h2 className="font-medium">Status e observações</h2>
        <div className="mb-4">
          <Badge variant="secondary" className="text-base">
            {statusLabel}
          </Badge>
        </div>
        <form
          className="space-y-4"
          action={(fd) => {
            startTransition(async () => {
              const r = await updateOrderAdminAction(orderId, {
                status: String(fd.get('status') ?? ''),
                estimated_fulfillment_text: String(fd.get('estimated') ?? ''),
                admin_note: String(fd.get('admin_note') ?? ''),
              });
              flash(r.ok, r.ok ? 'Salvo.' : r.message);
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="status">Status do pedido</Label>
            <select
              id="status"
              name="status"
              defaultValue={initialStatus}
              className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated">Prazo estimado (texto para o cliente)</Label>
            <Textarea
              id="estimated"
              name="estimated"
              rows={2}
              defaultValue={estimatedText ?? ''}
              placeholder="Ex.: Entrega até sexta, 18h"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_note">Nota interna</Label>
            <Textarea
              id="admin_note"
              name="admin_note"
              rows={2}
              defaultValue={adminNote ?? ''}
              placeholder="Substituições, avisos internos…"
            />
          </div>
          {msg ? <p className="text-sm text-green-700">{msg}</p> : null}
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando…' : 'Salvar status e notas'}
          </Button>
        </form>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-background p-4">
        <h2 className="font-medium">Itens</h2>
        <p className="text-sm text-muted-foreground">
          Ajuste quantidade ou substitua por outro produto ativo; totais do pedido são recalculados.
        </p>
        <ul className="space-y-6">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex flex-col gap-4 border-b border-border/60 pb-6 last:border-0 last:pb-0"
            >
              <div className="font-medium">{it.product_name_snapshot}</div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(Number(it.unit_price_snapshot))} × {it.quantity} ={' '}
                {formatCurrency(Number(it.line_total))}
              </div>
              <form
                className="flex flex-wrap items-end gap-2"
                action={(fd) => {
                  const q = Number(fd.get('qty'));
                  startTransition(async () => {
                    const r = await setOrderItemQuantityAction(orderId, it.id, q);
                    flash(r.ok, r.ok ? 'Quantidade atualizada.' : r.message);
                  });
                }}
              >
                <div className="space-y-1">
                  <Label className="text-xs">Qtd</Label>
                  <Input
                    type="number"
                    name="qty"
                    min={1}
                    max={99}
                    defaultValue={it.quantity}
                    className="w-20"
                  />
                </div>
                <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                  Atualizar qtd
                </Button>
              </form>
              <form
                className="flex flex-wrap items-end gap-2"
                action={(fd) => {
                  const pid = String(fd.get('product_id') ?? '');
                  const q = Number(fd.get('replace_qty'));
                  startTransition(async () => {
                    const r = await replaceOrderItemProductAction(orderId, it.id, pid, q);
                    flash(r.ok, r.ok ? 'Item substituído.' : r.message);
                  });
                }}
              >
                <div className="min-w-[220px] space-y-1">
                  <Label className="text-xs">Substituir por produto</Label>
                  <select
                    name="product_id"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Escolher…
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatCurrency(Number(p.price))}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Qtd</Label>
                  <Input
                    type="number"
                    name="replace_qty"
                    min={1}
                    max={99}
                    defaultValue={it.quantity}
                    className="w-20"
                  />
                </div>
                <Button type="submit" size="sm" variant="outline" disabled={pending}>
                  Substituir
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
