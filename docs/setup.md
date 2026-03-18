# Setup

## Status
Monorepo em **FASE 3 (EXECUTE)**. **Floricultura Web** pronta para deploy controlado (ETAPA 12). Deploy: ver `docs/deploy-checklist.md` e `docs/manual-steps.md`.

## Stack
Next.js, TypeScript, Tailwind, ShadCN/UI, Supabase, Vercel, Mercado Pago, React Hook Form, Zod.

## Package manager
**pnpm** — workspace na raiz (`pnpm-workspace.yaml`).

## Estrutura
- `apps/floricultura-web` — MVP floricultura (catálogo, checkout, MP, admin).
- `apps/home-decor-web` — mínimo.
- `packages/*` — ui, core, supabase, payments, notifications, utils.
- `supabase/floricultura` — migrations + seeds.

## Pré-requisitos locais
Node.js ≥ 18, pnpm, contas Supabase + Vercel + Mercado Pago (por marca).

---

## Variáveis — `floricultura-web`

Fonte de verdade: **`apps/floricultura-web/.env.example`**. Resumo:

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server (anon). |
| `SUPABASE_SERVICE_ROLE_KEY` | Só servidor: criação de pedidos, webhooks, rotas que precisam bypass RLS. |
| `NEXT_PUBLIC_SITE_URL` | Links públicos e **Mercado Pago** (`notification_url`, `back_urls`). Em produção com domínio próprio, use `https://...` sem barra final. |
| `MERCADO_PAGO_ACCESS_TOKEN` | Preference Checkout Pro; sem isso, checkout só “pagar na entrega/retirada”. |
| `PAYMENT_SYNC_SECRET` | `POST /api/payments/sync` com `Authorization: Bearer ...`. Se ausente, a rota retorna **503**. |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Opcional; reservado para evolução de validação de webhook. |

Não há outras variáveis obrigatórias no código atual da floricultura (sem Resend/WhatsApp no app ainda).

---

## URL pública (`getPublicSiteUrl`)
Ordem de resolução no código:
1. `NEXT_PUBLIC_SITE_URL`
2. `https://VERCEL_URL` (ambiente Vercel)
3. `http://localhost:3000` (dev local)

Para **produção com domínio próprio**, defina sempre `NEXT_PUBLIC_SITE_URL` para evitar links e callbacks apontando para `*.vercel.app`.

---

## Supabase — Floricultura
```bash
cd supabase/floricultura
supabase link --project-ref <PROJECT_REF>
supabase db push
supabase db seed
```
Primeiro admin: `docs/manual-steps.md`.

---

## Desenvolvimento local
```bash
pnpm install
cp apps/floricultura-web/.env.example apps/floricultura-web/.env.local
# Editar .env.local
pnpm dev   # sobe floricultura-web na porta 3000
```

Validação:
```bash
pnpm lint && pnpm typecheck && pnpm --filter floricultura-web build
```

---

## Vercel (floricultura-web)
- **Root Directory:** `apps/floricultura-web`
- O arquivo `apps/floricultura-web/vercel.json` define `installCommand` e `buildCommand` a partir da raiz do monorepo (`pnpm install` + `pnpm --filter floricultura-web build`).

---

## Referência
- `docs/architecture.md`
- `docs/deploy-checklist.md` — publicação e smoke test.
- `docs/manual-steps.md` — passos que não são automatizáveis na IDE.
