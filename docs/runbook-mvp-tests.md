# Runbook — testes manuais do MVP (Floricultura Web)

Marque **OK**, **NOK** ou **PENDENTE POR AMBIENTE** (browser/credenciais não disponíveis no executor).

---

## Registro de verificação automática (CI / ambiente de desenvolvimento)

Execução documentada em **`docs/progress.md`** (FASE MVP VERIFICATION). Resumo:

| Verificação | Resultado |
|-------------|-----------|
| `docker compose up -d postgres` | **OK** — container healthy, `pg_isready` OK |
| `pnpm lint` / `typecheck` / `build` | **OK** |
| Supabase CLI instalado | **OK** (v2.58.x no ambiente testado) |
| `supabase start` (stack local) | **OK** (primeira execução: pull longo de imagens) |
| `pnpm db:floricultura:sync` + `supabase db reset` | **OK** após correção: migrations em `supabase/migrations/` + `seed.sql` gerado |
| API REST categorias após seed | **OK** (`buques`, `presentes`) |
| Navegador: home → checkout → admin | **PENDENTE POR AMBIENTE** — exige `pnpm dev` + `.env.local` apontando para Supabase local ou cloud + admin criado |

**Antes de cada `db reset` local:** `pnpm db:floricultura:sync` (copia migrations + regenera `supabase/seed.sql` a partir de `seeds/`).

**Sem `pnpm` no PATH?** Na raiz do monorepo: `corepack enable && corepack prepare pnpm@9.14.2 --activate`, ou use **`npm run`** a partir de `apps/floricultura-web` (ex.: `npm run db:supabase:start` — sobe à raiz e chama `npx pnpm`).

---

## 1. Preparação do ambiente

### 1.1 App + Supabase local (E2E completo)

| Passo | OK / NOK / PENDENTE |
|-------|---------------------|
| `pnpm db:floricultura:sync` na raiz | |
| `cd supabase/floricultura && supabase start` (se ainda não estiver rodando) | |
| `cd supabase/floricultura && supabase db reset` | |
| `supabase status` — anotar API URL e chaves (Publishable = anon no fluxo local recente) | |
| `.env.local` no app com URL `http://127.0.0.1:54321`, anon/publishable, **service role = Secret key** do status | |
| Criar usuário Auth no Studio (`http://127.0.0.1:54323`) + `INSERT` em `public.admins` | |
| `pnpm dev` → home em `http://localhost:3000` | |

### 1.2 App + Supabase cloud

| Passo | OK / NOK / PENDENTE |
|-------|---------------------|
| Migrations aplicadas no projeto (Dashboard SQL ou `supabase link` + `supabase db push`) | |
| **Seed com admin de teste:** na raiz, `pnpm seed:floricultura` (cria usuário Auth + linha em `admins`; se houver `DATABASE_URL` em `apps/floricultura-web/.env`, aplica também o seed SQL: settings, categorias, produtos, banners, frete, cliente/pedido exemplo) | |
| Credenciais admin teste: **admin@flordoestudante.com.br** / **Admin123!** (ver `docs/seed-e2e-test.md`) | |
| Seeds em prod: **não** usar seed demo; em dev/staging, ok usar o script acima | |
| `.env.local` com keys do projeto cloud | |

### 1.3 Docker Compose (Postgres auxiliar)

| Passo | OK / NOK / PENDENTE |
|-------|---------------------|
| `pnpm docker:up` | |
| Healthcheck / `pg_isready` | |
| Lembrete: app não usa esse Postgres diretamente | |

### 1.4 Mercado Pago

| Passo | OK / NOK / PENDENTE |
|-------|---------------------|
| Token TEST em `.env.local` | |
| Webhook local | **PENDENTE** sem tunnel |

---

## 2. Fluxo público

| # | Teste | OK / NOK / PENDENTE |
|---|--------|---------------------|
| P1 | Home | |
| P2 | `/catalogo` | |
| P3 | PDP | |
| P4 | Carrinho | |
| P5 | `/carrinho` | |
| P6 | `/checkout` | |
| P7 | Retirada + offline → código `FD-…` | |
| P8 | Entrega + offline | |
| P9 | `/pedido/[codigo]` | |
| P10 | Prazo na página pública após admin preencher | |

---

## 3. Pagamento

| # | Teste | OK / NOK / PENDENTE |
|---|--------|---------------------|
| PG1 | Offline | |
| PG2 | MP sandbox | |
| PG3 | `/pedido/.../pagamento` | |

---

## 4. Admin

| # | Teste | OK / NOK / PENDENTE |
|---|--------|---------------------|
| A1 | `/admin/login` | |
| A2 | Usuário sem `admins` → bloqueio | |
| A3 | `/admin` — home com cards visuais | |
| A4 | `/admin/pedidos` — filtros por status | |
| A5 | Lista: botões WhatsApp e copiar link | |
| A6 | Detalhe: seção cliente + WhatsApp | |
| A7 | Detalhe: status, prazo, nota | |
| A8 | Qtd / substituir item | |
| A9 | Reflexo na página pública | |
| A10 | Sair | |

---

## 4.1 Importação de produtos (SaaS)

| # | Teste | OK / NOK / PENDENTE |
|---|--------|---------------------|
| I1 | `/admin/produtos/import` — download template | |
| I2 | Preencher planilha válida (2-3 produtos) | |
| I3 | Upload e importação — sucesso 100% | |
| I4 | Planilha com erros (preço inválido, categoria vazia) | |
| I5 | Resumo de erros por linha | |
| I6 | Produtos importados aparecem em `/admin/produtos` | |
| I7 | Produtos com URLs de imagens extras | |
| I8 | `imports_log` registra corretamente | |

---

## 5. Bordas

| # | Teste | OK / NOK / PENDENTE |
|---|--------|---------------------|
| B1 | Carrinho vazio → checkout | |
| B2 | Pedido inexistente | |
| B3 | MP pendente/expirado | |
| B4 | Env Supabase ausente | |
| B5 | Entrega sem shipping rule | |
| B6 | Sync sem secret → 503 | |

---

## 6. Aceite MVP + SaaS

Ver critérios em **`docs/client-cutover-plan.md`** e **`docs/handoff-operacao.md`**.

### Critérios adicionais SaaS
- [ ] Template de importação XLSX funciona em mobile (seleção de arquivo, upload)
- [ ] Dashboard admin tem aparência profissional e navegação clara
- [ ] Filtros de pedidos funcionam corretamente (em aberto, concluídos, cancelados)
- [ ] Botões de WhatsApp abrem conversa com mensagem pré-formatada
- [ ] Link público de pedido é copiado corretamente e abre em nova aba
- [ ] Animações de surgimento são suaves e respeitam `prefers-reduced-motion`
- [ ] Loadings são evidentes em todas as ações longas (importação, salvamento de pedido)

---

## 7. Pós-base do cliente

Seguir **`docs/client-cutover-plan.md`**.
