# Flor do Estudante

Monorepo com dois apps independentes:

- **floricultura-web** — cardápio digital transacional (MVP com aprovação manual de pedidos)
- **home-decor-web** — catálogo/e-commerce leve (MVP preparado para evolução)

## Stack

Next.js, TypeScript, Tailwind, ShadCN/UI, Supabase, Vercel, Mercado Pago, React Hook Form, Zod.

## Estrutura

- `apps/floricultura-web` — app Next.js da floricultura
- `apps/home-decor-web` — app Next.js da home decor
- `packages/ui` — componentes e design system base
- `packages/core` — tipos, schemas e regra de domínio
- `packages/supabase` — clientes e helpers Supabase
- `packages/payments` — integração Mercado Pago
- `packages/notifications` — builders de notificação
- `packages/utils` — utilitários puros
- `supabase/floricultura` — migrations e seeds da floricultura
- `supabase/home-decor` — migrations e seeds da home decor
- `docs` — documentação do projeto

## Desenvolvimento

**Node >= 18.** Para **pnpm** global: `corepack enable && corepack prepare pnpm@9.14.2 --activate`.  
Se aparecer `command not found: pnpm`, use **`npx pnpm@9.14.2 <comando>`** na **raiz** do repo, ou, estando em **`apps/floricultura-web`**:

```bash
npm run db:supabase:start   # Supabase local (delega à raiz via npx pnpm)
npm run db:supabase:reset
```

Scripts `db:*` e `docker:*` estão definidos na **raiz** do monorepo; na raiz: `pnpm db:supabase:start`, etc.

```bash
pnpm install
pnpm dev          # sobe floricultura-web em http://localhost:3000
pnpm build
pnpm lint
pnpm typecheck
```

Subir home-decor-web:

```bash
pnpm --filter home-decor-web dev
```

## Documentação

- [docs/progress.md](docs/progress.md) — status e progresso
- [docs/architecture.md](docs/architecture.md) — arquitetura e modelagem
- [docs/setup.md](docs/setup.md) — setup e variáveis
- [docs/implementation-plan.md](docs/implementation-plan.md) — plano de execução
