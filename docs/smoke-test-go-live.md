# Smoke test — go-live (executável)

Preencha na **URL de produção** após DNS e envs finais. Para cada passo marque **OK**, **NOK** ou anote **observação**.

**Domínio base:** `https://________________`

---

## A — Público

| # | Passo | OK / NOK / obs. |
|---|--------|-----------------|
| A1 | Home carrega sem erro | |
| A2 | `/catalogo` lista categorias e produtos | |
| A3 | Abrir um produto (PDP): imagem e preço ok | |
| A4 | Adicionar ao carrinho; contagem no header coerente | |

---

## B — Checkout

| # | Passo | OK / NOK / obs. |
|---|--------|-----------------|
| B1 | **Retirada** + pagar na retirada → recebe código `FD-...` | |
| B2 | **Entrega** + endereço + pagar na entrega → pedido criado | |
| B3 | (Se MP ativo) **Retirada ou entrega** + Mercado Pago → redireciona ao MP | |

---

## C — Pagamento

| # | Passo | OK / NOK / obs. |
|---|--------|-----------------|
| C1 | Pedido offline: em `/pedido/[codigo]` status e total corretos | |
| C2 | Pedido MP: após pagar (ou sandbox), status vira pago ou aguardando aprovação (webhook ou sync) | |
| C3 | `/pedido/[codigo]/pagamento` mostra estado coerente (link MP, expirado, pago) | |

---

## D — Acompanhamento público

| # | Passo | OK / NOK / obs. |
|---|--------|-----------------|
| D1 | `/pedido/[codigo]` abre **sem login** | |
| D2 | Dados do pedido batem com o que foi feito no checkout | |

---

## E — Admin

| # | Passo | OK / NOK / obs. |
|---|--------|-----------------|
| E1 | `/admin/login` — login com usuário que está em `admins` | |
| E2 | `/admin` — painel carrega após login | |
| E3 | Listar/gerir pedidos (fluxo disponível no painel) | |
| E4 | Alterar status de um pedido (ex.: aprovado) | |

---

## F — Fechamento

| # | Passo | OK / NOK / obs. |
|---|--------|-----------------|
| F1 | Recarregar `/pedido/[codigo]` do pedido editado no admin — status reflete mudança | |
| F2 | (Opcional) Testar sync: `curl POST .../api/payments/sync` com secret e `publicCode` | |

---

## Se algo for NOK

- **Checkout / MP:** Vercel envs (`MERCADO_PAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_SITE_URL`).
- **Webhook:** URL no MP = `https://DOMÍNIO/api/webhooks/mercado-pago`; logs `[mercado-pago webhook]`.
- **Admin:** Auth Supabase + tabela `admins`.
- Ver **`docs/handoff-operacao.md`** (contingência).
