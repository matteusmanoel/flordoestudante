# Supabase — Floricultura (Flor do Estudante)

## Estrutura

- **`migrations/`** — fonte canônica do schema (00001…00006).
- **`seeds/`** — fonte canônica dos dados demo.
- **`supabase/migrations/`** — cópia consumida pelo **Supabase CLI** (gerada).
- **`supabase/seed.sql`** — gerado a partir de `seeds/` (CLI não aceita `\i` no seed).

## Antes de `supabase db reset` (local)

Na **raiz do monorepo**:

```bash
pnpm db:floricultura:sync
```

Isso executa:

1. `scripts/sync-floricultura-supabase.sh` — copia `migrations/*.sql` → `supabase/migrations/`.
2. `scripts/merge-floricultura-seed.sh` — gera `supabase/seed.sql` a partir de `seeds/`.

Depois:

```bash
cd supabase/floricultura
supabase start    # primeira vez: download de imagens
supabase db reset
```

## Projeto remoto (cloud)

```bash
cd supabase/floricultura
supabase link --project-ref <PROJECT_REF>
supabase db push
```

**Produção:** não rodar seed demo. Dados reais do cliente.

## Primeiro admin

Dashboard → Authentication → usuário → UUID → `INSERT` em `public.admins` (ver `docs/manual-steps.md`).

## Postgres Docker na raiz do monorepo

`docker compose up postgres` — auxiliar; não substitui esta stack para o app Next.js.
