# Supabase — Floricultura (Flor do Estudante)

Projeto Supabase da aplicação **floricultura-web**. Cada app do monorepo tem seu próprio projeto Supabase em produção (dados isolados).

## Estrutura

- **migrations/** — Schema e alterações (enums, tabelas, RLS, storage). Ordem: `00001_*` … `00006_*`.
- **seeds/** — Dados iniciais para desenvolvimento (`01_*`, `02_*`).
- **config.toml** — Configuração do Supabase CLI para este projeto.

## Comandos (executar nesta pasta)

```bash
# Vincular ao projeto remoto (pegue PROJECT_REF no dashboard do Supabase)
supabase link --project-ref <PROJECT_REF>

# Aplicar migrations
supabase db push

# Rodar seeds (após push)
supabase db seed

# Gerar tipos TypeScript a partir do schema (requer link)
supabase gen types typescript --local > ../../packages/supabase/src/types/database-floricultura.ts
```

Para desenvolvimento local com containers:

```bash
supabase start
supabase db reset   # aplica migrations + seeds
supabase stop
```

## Primeiro admin

O primeiro usuário admin não é criado pelas seeds (depende do Auth). Ver `docs/manual-steps.md`: criar usuário em **Authentication** no dashboard e depois inserir/atualizar a linha em `admins` com o `auth_user_id` correspondente.
