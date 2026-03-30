'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, DropdownMenuItem } from '@flordoestudante/ui';
import { Badge } from '@flordoestudante/ui';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@flordoestudante/core';
import { formatCurrency, formatDateTime } from '@flordoestudante/utils';
import { Eye, MessageCircle, Link2, Check } from 'lucide-react';
import { getWhatsAppUrl } from '@flordoestudante/notifications';
import { AdminEntityCard, AdminRowActionsMenu } from '@/components/admin/list';

type OrderRow = {
  id: string;
  public_code: string;
  status: string;
  payment_status: string;
  total_amount: string;
  created_at: string;
  customers: { full_name: string; phone: string | null } | null;
  order_items: Array<{ product_name_snapshot: string }> | null;
};

interface AdminOrdersTableClientProps {
  orders: OrderRow[];
  storeName: string;
  siteUrl: string;
}

const STATUS_GROUPS = {
  open: ['pending_payment', 'paid', 'awaiting_approval', 'in_production', 'ready_for_pickup', 'out_for_delivery'],
  completed: ['completed'],
  cancelled: ['cancelled', 'expired'],
};

export function AdminOrdersTableClient({ orders, storeName, siteUrl }: AdminOrdersTableClientProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'completed' | 'cancelled'>('open');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    return STATUS_GROUPS[filter].includes(o.status);
  });

  function handleCopyLink(publicCode: string) {
    const url = `${siteUrl}/pedido/${encodeURIComponent(publicCode)}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(publicCode);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function buildWhatsAppMessage(publicCode: string, statusLabel: string) {
    const trackingUrl = `${siteUrl}/pedido/${encodeURIComponent(publicCode)}`;
    return `Olá! Sobre o pedido *${publicCode}* em ${storeName}:\n\nStatus: *${statusLabel}*\n\nAcompanhe aqui: ${trackingUrl}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === 'open' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('open')}
        >
          Em aberto
          <Badge variant="secondary" className="ml-2">
            {orders.filter((o) => STATUS_GROUPS.open.includes(o.status)).length}
          </Badge>
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Concluídos
          <Badge variant="secondary" className="ml-2">
            {orders.filter((o) => STATUS_GROUPS.completed.includes(o.status)).length}
          </Badge>
        </Button>
        <Button
          variant={filter === 'cancelled' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('cancelled')}
        >
          Cancelados/Expirados
          <Badge variant="secondary" className="ml-2">
            {orders.filter((o) => STATUS_GROUPS.cancelled.includes(o.status)).length}
          </Badge>
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todos
        </Button>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhum pedido {filter !== 'all' ? `em "${filter}"` : ''}.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredOrders.map((o) => {
              const cust = o.customers;
              const itemCount = o.order_items?.length || 0;
              const statusLabel = ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status;
              const waUrl = cust?.phone
                ? getWhatsAppUrl(cust.phone, buildWhatsAppMessage(o.public_code, statusLabel))
                : null;
              return (
                <AdminEntityCard
                  key={o.id}
                  href={`/admin/pedidos/${o.id}`}
                  title={<span className="font-mono text-sm">{o.public_code}</span>}
                  subtitle={
                    <span>
                      {cust?.full_name ?? '—'}
                      {cust?.phone ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">{cust.phone}</span>
                      ) : null}
                    </span>
                  }
                  badges={<Badge variant="secondary">{statusLabel}</Badge>}
                  meta={
                    <span>
                      {itemCount} {itemCount === 1 ? 'item' : 'itens'} · {formatCurrency(Number(o.total_amount))} ·{' '}
                      <span className="whitespace-nowrap">{formatDateTime(o.created_at)}</span>
                      <span className="mt-0.5 block capitalize text-muted-foreground">
                        Pag.: {o.payment_status.replace(/_/g, ' ')}
                      </span>
                    </span>
                  }
                  actions={
                    <AdminRowActionsMenu>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/pedidos/${o.id}`}>
                          <Eye className="mr-2 inline h-4 w-4 align-text-bottom" />
                          Ver detalhe
                        </Link>
                      </DropdownMenuItem>
                      {waUrl ? (
                        <DropdownMenuItem asChild>
                          <a href={waUrl} target="_blank" rel="noreferrer">
                            <MessageCircle className="mr-2 inline h-4 w-4 align-text-bottom" />
                            WhatsApp
                          </a>
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          handleCopyLink(o.public_code);
                        }}
                      >
                        {copiedCode === o.public_code ? (
                          <>
                            <Check className="mr-2 inline h-4 w-4 align-text-bottom text-green-600" />
                            Link copiado
                          </>
                        ) : (
                          <>
                            <Link2 className="mr-2 inline h-4 w-4 align-text-bottom" />
                            Copiar link
                          </>
                        )}
                      </DropdownMenuItem>
                    </AdminRowActionsMenu>
                  }
                />
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border border-border bg-background md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Itens</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Pagamento</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const cust = o.customers;
                const itemCount = o.order_items?.length || 0;
                const statusLabel = ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status;
                return (
                  <tr key={o.id} className="border-b border-border/80 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{o.public_code}</td>
                    <td className="px-4 py-3">
                      {cust?.full_name ?? '—'}
                      {cust?.phone ? (
                        <span className="block text-xs text-muted-foreground">{cust.phone}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{statusLabel}</Badge>
                    </td>
                    <td className="px-4 py-3 capitalize">{o.payment_status.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(o.total_amount))}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(o.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="ghost" title="Ver detalhe">
                          <Link href={`/admin/pedidos/${o.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {cust?.phone ? (
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            title="Conversar no WhatsApp"
                          >
                            <a
                              href={getWhatsAppUrl(
                                cust.phone,
                                buildWhatsAppMessage(o.public_code, statusLabel)
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          title={copiedCode === o.public_code ? 'Copiado!' : 'Copiar link'}
                          onClick={() => handleCopyLink(o.public_code)}
                        >
                          {copiedCode === o.public_code ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
