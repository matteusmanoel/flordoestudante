# Setup

## Status
**FASE FINAL — MVP closure:** floricultura com admin operacional (pedidos, status, itens), Docker Compose (Postgres auxiliar), seeds via Supabase CLI, runbook em `docs/runbook-mvp-tests.md`. Plano de fechamento: `docs/mvp-closure-plan.md`.

## Stack
Next.js, TypeScript, Tailwind, ShadCN/UI, Supabase (Auth + DB + API), Vercel, Mercado Pago, React Hook Form, Zod, `@supabase/ssr` (sessão admin).

## Package manager
**pnpm** — workspace na raiz.

---

## Dois modos de banco (importante)

| Modo | Quando usar | Comando |
|------|-------------|---------|
| **Supabase (recomendado para o app)** | Desenvolvimento E2E, produção | Projeto cloud **ou** `pnpm db:supabase:start` + `pnpm db:supabase:reset` |
| **Postgres só Docker (raiz)** | Postgres isolado para testes manuais, backups, futuras ferramentas | `pnpm docker:up` |

O Next.js fala com Supabase (URL + keys), **não** com `DATABASE_URL` do Compose. O Postgres do Compose **não substitui** Supabase para login admin, RLS via API nem checkout.

---

## Docker Compose (Postgres 16)

Na raiz do monorepo:

```bash
cp .env.docker.example .env.docker   # opcional — valores padrão funcionam
pnpm docker:up
```

- Container: `flordoestudante-postgres-dev`
- Porta padrão: **54332** → Postgres interno 5432
- Healthcheck habilitado
- Volume: `flordoestudante_pgdata`

```bash
pnpm docker:down
pnpm docker:logs
```

---

## Supabase local (schema + seed completos)

Requer [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
cd supabase/floricultura
supabase start              # sobe stack local (Postgres + API + Auth + Studio)
supabase db reset           # migrations + seeds (01 + 02)
```

Na **primeira vez**, apontar o app para URLs locais do `supabase start` (exibidas no terminal) em `apps/floricultura-web/.env.local`.

Scripts na raiz:

- `pnpm db:floricultura:sync` — copia migrations para `supabase/migrations/` e regenera `supabase/seed.sql`
- `pnpm db:supabase:start` — `supabase start`
- `pnpm db:supabase:stop` — `supabase stop`
- `pnpm db:supabase:reset` — **sync +** `supabase db reset` (schema + seed demo local)

Seeds (`config.toml` → `db.seed`): categorias, produtos, banners, frete, cliente/pedido exemplo. **Admin:** criar no Auth + `public.admins` (ver `docs/manual-steps.md`).

---

## Projeto Supabase na nuvem (dev)

```bash
pnpm db:floricultura:sync
cd supabase/floricultura
supabase link --project-ref <REF>
supabase db push
```

Produção: sem seed demo. `apps/floricultura-web/.env.local` com URL/keys desse projeto.

---

## Variáveis — `floricultura-web`

Ver `apps/floricultura-web/.env.example`. Admin exige as mesmas chaves Supabase + service role.

---

## Desenvolvimento

```bash
pnpm install
cp apps/floricultura-web/.env.example apps/floricultura-web/.env.local
pnpm dev
```

---

## Validação técnica

```bash
pnpm lint && pnpm typecheck && pnpm build
```

Testes funcionais: **`docs/runbook-mvp-tests.md`**.

---

## Vercel
Root Directory `apps/floricultura-web`; ver `vercel.json` do app.

---

## Referência
- `docs/runbook-mvp-tests.md` — QA MVP
- `docs/mvp-closure-plan.md` — auditoria / fechamento
- `docs/deploy-checklist.md`, `docs/handoff-operacao.md`, `docs/manual-steps.md`
