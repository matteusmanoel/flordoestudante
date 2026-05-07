# Guia de Deploy — Floricultura Web (MVP)

**Última atualização:** 2026-03-30  
**Stack:** Next.js 14 · Supabase · Vercel · Mercado Pago · Stripe (assinaturas)

**Pedidos avulsos (checkout do carrinho):** apenas **Mercado Pago** e **pagar na entrega/retirada**. O pagamento one-shot via Stripe para pedidos da loja está **desativado** no código (`features/checkout/actions.ts` + UI em `CheckoutFulfillmentSection`). As **assinaturas** (`/assinaturas/*`) continuam usando Stripe Checkout.

**Demonstração em produção:** credenciais de utilizador showcase (admin demo) em **`docs/demo-showcase-acesso.md`**.

---

## Índice

1. [Pré-condições e estado do código](#1-pré-condições-e-estado-do-código)
2. [Supabase — configuração de produção](#2-supabase--configuração-de-produção)
3. [Vercel — importar e configurar o projeto](#3-vercel--importar-e-configurar-o-projeto)
4. [Variáveis de ambiente](#4-variáveis-de-ambiente)
5. [Mercado Pago](#5-mercado-pago)
6. [Stripe (assinaturas)](#6-stripe-assinaturas)
7. [Domínio e DNS](#7-domínio-e-dns)
8. [Primeiro deploy e primeiro admin](#8-primeiro-deploy-e-primeiro-admin)
9. [Smoke test pós-deploy](#9-smoke-test-pós-deploy)
10. [Monitoramento e operação inicial](#10-monitoramento-e-operação-inicial)
11. [Rollback](#11-rollback)

---

## 1. Pré-condições e estado do código

### 1.1 Build local deve passar limpo

```bash
# na raiz do monorepo
pnpm install
pnpm --filter floricultura-web typecheck
pnpm --filter floricultura-web lint
pnpm --filter floricultura-web build
```

Aviso ESLint `"Next.js plugin was not detected"` é esperado (configuração de monorepo) e **não bloqueia** a build.

### 1.2 Verificações de segurança

- [ ] Nenhuma chave real em `.env.example` (apenas placeholders)
- [ ] `.env` e `.env.local` em `.gitignore`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` **não** prefixada com `NEXT_PUBLIC_` (nunca exposta ao browser)
- [ ] `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` **não** prefixadas com `NEXT_PUBLIC_`

### 1.3 Migrations em ordem

As migrations devem ser aplicadas em sequência:

| Arquivo | Descrição |
|---------|-----------|
| `00001_enums.sql` | Tipos PostgreSQL (order_status, payment_method, etc.) |
| `00002_core_tables.sql` | settings, admins, categories, products, banners, shipping_rules, customers, addresses |
| `00003_orders_and_payments.sql` | orders, order_items, payments, order_status_history, imports_log |
| `00004_triggers.sql` | update_updated_at() + triggers |
| `00005_rls.sql` | Row Level Security — leitura pública do catálogo |
| `00006_storage_buckets.sql` | Buckets: product-images, banner-images, brand-assets |
| `00007_subscriptions_and_addons.sql` | subscription_plans, subscriptions, addons, plan_addons, product_addons |
| `00008_product_recommendations.sql` | product_recommendations + RLS |
| `00009_product_recommendations_rls.sql` | Idempotente — garante policy se 00008 falhou |
| `00010_storage_plans_addons.sql` | Buckets: subscription-plan-images, addon-images |
| `00011_normalize_storage_paths.sql` | Normaliza URLs absolutas para formato `bucket/path` |
| `00012_subscription_pending_status.sql` | Adiciona `pending_payment` ao enum `subscription_status` |

---

## 2. Supabase — configuração de produção

### 2.1 Criar projeto de produção

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Escolha uma **região próxima ao Brasil** (recomendado: `sa-east-1` São Paulo)
3. Defina uma **senha forte** para o banco e guarde no cofre de senhas
4. Aguarde o projeto ficar Online

### 2.2 Aplicar migrations

```bash
# na raiz do monorepo
cd supabase/floricultura
supabase login
supabase link --project-ref <SEU_PROJECT_REF>
supabase db push
```

> `<SEU_PROJECT_REF>` = identificador de 20 chars do projeto (aparece na URL: `app.supabase.com/project/<REF>`)

Verificar no **Table Editor** ou **SQL Editor** que todas as 12 migrations foram aplicadas.

### 2.3 Aplicar seed de produção (opcional)

O seed `01_settings_and_catalog.sql` cria `settings` com dados placeholder. **Editar antes** com dados reais da loja (nome, telefone, e-mail de suporte). As seeds `02_dev_customer_and_order.sql` e `03_subscriptions_and_addons.sql` são apenas para **desenvolvimento local**.

```bash
# seed 01 apenas (configuração da loja)
supabase db seed --db-url <CONNECTION_STRING_PROD>
```

Ou executar diretamente no SQL Editor do Dashboard.

### 2.4 Chaves de acesso

No Dashboard: **Settings → API**

| Variável | Onde encontrar |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` (oculto, copiar com cuidado) |

### 2.5 Configurar Storage (buckets)

A migration `00006` e `00010` criam os buckets. Confirmar no Dashboard → **Storage** que existem:

- `product-images` (público)
- `banner-images` (público)
- `brand-assets` (público)
- `subscription-plan-images` (público)
- `addon-images` (público)

Se necessário, criar manualmente com acesso público (arquivos são URLs visíveis no catálogo).

### 2.6 Criar o primeiro usuário admin

No **Dashboard → Authentication → Users** → **Add user** (email + senha).

Copiar o `UUID` gerado e executar no **SQL Editor**:

```sql
INSERT INTO public.admins (auth_user_id, email, full_name, role, is_active)
VALUES (
  '<UUID_DO_AUTH_USER>',
  'admin@suaemail.com',
  'Nome do Admin',
  'owner',
  true
);
```

> A senha de acesso ao painel é a senha do usuário Supabase Auth — pode ser trocada pelo próprio usuário pelo Dashboard.

---

## 3. Vercel — importar e configurar o projeto

### 3.1 Importar repositório

1. **New Project** → importar do GitHub/GitLab
2. **Root Directory**: `apps/floricultura-web`
3. **Framework preset**: Next.js (detectado automaticamente)
4. O `vercel.json` dentro de `apps/floricultura-web` já configura:
   - `installCommand`: `cd ../.. && pnpm install` (instala da raiz do monorepo)
   - `buildCommand`: `cd ../.. && pnpm --filter floricultura-web build`

### 3.2 Branch de produção

Recomendado: `main` → produção automática a cada push.  
Branch `develop` ou `staging` → preview automático (útil para validar antes de ir ao ar).

### 3.3 Node.js

Configurar Node.js **20.x** no projeto Vercel (Settings → General → Node.js Version).

---

## 4. Variáveis de ambiente

Configurar em **Vercel → Project → Settings → Environment Variables**.  
Selecionar ambiente **Production** (e opcionalmente Preview).

### 4.1 Supabase (obrigatórias)

| Variável | Ambiente | Exemplo/Nota |
|----------|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | Chave `anon` do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Chave `service_role` — **somente servidor** |

### 4.2 Site URL (obrigatória após domínio)

| Variável | Ambiente | Exemplo/Nota |
|----------|----------|--------------|
| `NEXT_PUBLIC_SITE_URL` | Production | `https://loja.flordoestudante.com.br` — sem barra final |

> Antes de ter domínio próprio, a Vercel usa `VERCEL_URL` internamente. Após configurar domínio, **esta variável é obrigatória** para links de retorno do Mercado Pago e notificações funcionarem corretamente.

### 4.3 Mercado Pago

| Variável | Ambiente | Exemplo/Nota |
|----------|----------|--------------|
| `MERCADO_PAGO_ACCESS_TOKEN` | Production | `APP_USR-...` (produção) ou `TEST-...` (sandbox) |
| `PAYMENT_SYNC_SECRET` | Production | String longa aleatória — protege `/api/payments/sync` |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Production | Opcional no MVP |

> Para gerar `PAYMENT_SYNC_SECRET`: `openssl rand -hex 32`

### 4.4 Stripe (assinaturas)

| Variável | Ambiente | Exemplo/Nota |
|----------|----------|--------------|
| `STRIPE_SECRET_KEY` | Production | `sk_live_...` (produção) ou `sk_test_...` (sandbox) |
| `STRIPE_PUBLISHABLE_KEY` | Production | `pk_live_...` — prefixo `NEXT_PUBLIC_` se usado no client |
| `STRIPE_WEBHOOK_SECRET` | Production | `whsec_...` — gerado ao registrar o webhook |

> Sem `STRIPE_SECRET_KEY`, o checkout de assinaturas retorna `"Stripe não configurado"`. Fluxo Stripe **não é obrigatório** para o MVP de pedidos avulsos.

### 4.5 Resumo — `.env.example` atualizado

Copiar e preencher em `.env.local` para dev ou configurar nas envs da Vercel:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# URL pública do site (sem barra final)
NEXT_PUBLIC_SITE_URL=https://seudominio.com.br

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=
PAYMENT_SYNC_SECRET=

# Stripe (opcional para MVP de pedidos; obrigatório para assinaturas)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# String de conexão direta (opcional — scripts locais)
# DATABASE_URL=postgresql://postgres:SENHA@db.REF.supabase.co:5432/postgres
```

---

## 5. Mercado Pago

### 5.1 Criar aplicativo

1. Acesse [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. **Criar aplicativo** → tipo "Checkout Pro"
3. Copiar **Access Token** (produção ou sandbox)

### 5.2 Configurar webhook

No painel MP → **Webhooks** → URL de notificação:

```
https://<SEU_DOMÍNIO>/api/webhooks/mercado-pago
```

Eventos: `payment` (obrigatório).

Checklist mínimo do endpoint:
- método: `POST` (IPN `GET` também é aceito pela rota)
- URL: `https://<SEU_DOMÍNIO>/api/webhooks/mercado-pago`
- ambiente do app MP deve corresponder ao token na Vercel (`APP_USR-...` produção ou `TEST-...` sandbox)
- se houver token legado em env, migrar para `MERCADO_PAGO_ACCESS_TOKEN`

> O webhook aceita POST e GET (IPN). Logs via `console.log('[mercado-pago webhook]')` visíveis nos logs da Vercel.

### 5.3 Testar com sandbox

Use `TEST-xxxx` como `MERCADO_PAGO_ACCESS_TOKEN` e cartões de teste do MP.  
Após validação, trocar pelo token de produção e **redeploy**.

---

## 6. Stripe (assinaturas)

### 6.1 Criar produtos no Stripe

Planos de assinatura precisam ter `stripe_product_id` e `stripe_price_id` preenchidos na tabela `subscription_plans` (ou o código usa `price_data` inline — confirmar em `lib/stripe/create-checkout.ts`).

### 6.2 Configurar webhook Stripe

No [Dashboard Stripe](https://dashboard.stripe.com) → **Developers → Webhooks** → **Add endpoint**:

```
https://<SEU_DOMÍNIO>/api/webhooks/stripe
```

Eventos a escutar:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copiar o **Signing secret** (`whsec_...`) → variável `STRIPE_WEBHOOK_SECRET`.

> **Sem `STRIPE_WEBHOOK_SECRET` configurado**, o webhook aceita eventos não verificados com aviso de console. Em produção, **a variável é obrigatória** para segurança.

### 6.3 Status de assinatura

O fluxo correto com a correção aplicada (2026-03-30):

1. Cliente finaliza formulário → assinatura criada no banco com `status = 'pending_payment'`
2. Cliente redireciona para o Stripe Checkout
3. Webhook `checkout.session.completed` → status atualizado para `'active'`
4. Se cliente abandonar: assinatura fica `'pending_payment'` (sem cobranças)

---

## 7. Domínio e DNS

### 7.1 Adicionar domínio na Vercel

1. Vercel → Project → **Settings → Domains** → Add domain
2. A Vercel mostra os registros DNS a configurar (A + CNAME ou nameservers)

### 7.2 Configurar registros DNS

| Tipo | Nome | Valor |
|------|------|-------|
| `A` | `@` ou `loja` | IP fornecido pela Vercel |
| `CNAME` | `www` | `cname.vercel-dns.com` |

> Propagação: de 1 minuto a 48 horas dependendo do registrar.

### 7.3 Atualizar NEXT_PUBLIC_SITE_URL

Após SSL ativo no domínio:

1. Vercel → Environment Variables → `NEXT_PUBLIC_SITE_URL` = `https://seudominio.com.br`
2. **Redeploy** (obrigatório para as variáveis de servidor atualizarem)

---

## 8. Primeiro deploy e primeiro admin

### 8.1 Ordem de execução

```
1. Aplicar migrations no Supabase de produção  ← Supabase CLI
2. Criar usuário admin no Supabase Auth          ← Dashboard Auth
3. Inserir linha em public.admins               ← SQL Editor
4. Configurar envs na Vercel                    ← Dashboard Vercel
5. Fazer o deploy (push na main ou trigger manual)
6. Acessar https://<DOMÍNIO>/admin/login e testar login
```

### 8.2 Verificação básica pós-deploy

```bash
# Verificar health da API
curl https://<SEU_DOMÍNIO>/api/health
# Esperado: {"ok":true,"ts":"..."}
```

---

## 9. Smoke test pós-deploy

Executar o checklist completo em `docs/smoke-test-go-live.md`. Pontos prioritários:

| Fluxo | Critério mínimo de OK |
|-------|-----------------------|
| Home pública | Carrega sem erros, banners visíveis |
| Catálogo | Produtos listados, imagens carregadas |
| Produto | Galeria, preço, botão "Adicionar" funciona |
| Carrinho | Itens adicionados, subtotal correto |
| Checkout retirada + pagar na retirada | Pedido criado, página de confirmação com código |
| Checkout entrega + MP | Redireciona para MP, após pagamento status atualiza |
| Acompanhamento de pedido `/pedido/[codigo]` | Status, itens, dados de entrega |
| Login admin `/admin/login` | Autentica, redireciona para `/admin` |
| Admin → listar pedidos | Pedido do smoke test aparece |
| Admin → aprovar pedido | Status muda, admin_note salva |
| Admin → upload imagem produto | Imagem aparece no Storage e no catálogo |

---

## 10. Monitoramento e operação inicial

### 10.1 Logs Vercel

Vercel → Project → **Deployments → Functions**. Prefixos de log úteis:

| Prefixo | Origem |
|---------|--------|
| `[mercado-pago webhook]` | Webhooks MP |
| `[stripe webhook]` | Webhooks Stripe |
| `[payments/sync]` | Reconciliação manual |

### 10.2 Sync manual de pagamento (se webhook atrasar)

```bash
curl -sS -X POST "https://<DOMÍNIO>/api/payments/sync" \
  -H "Authorization: Bearer <PAYMENT_SYNC_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"publicCode":"FD-2026-XXXXXXXX"}'
```

### 10.3 Primeiros dias

- Monitorar erros 5xx em `/api/webhooks/*` e `/api/upload`
- Verificar se pedidos pagos estão migrando para `awaiting_approval`
- Admin aprovar pedidos manualmente (processo definido em `docs/handoff-operacao.md`)

---

## 11. Rollback

### 11.1 Rollback de deploy (Vercel)

Vercel → Project → **Deployments** → escolher deploy anterior → **Promote to Production**.

### 11.2 Rollback de migration (Supabase)

Não existe rollback automático. Para reverter uma migration:

```sql
-- Exemplo: reverter 00012
ALTER TYPE subscription_status RENAME TO subscription_status_old;
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
-- Migrar dados e dropar o tipo antigo
```

> Sempre testar migrations em ambiente de staging antes de produção.

---

## Apêndice — Correções aplicadas em 2026-03-30

As seguintes lacunas foram identificadas e corrigidas antes do go-live:

| # | Problema | Arquivo corrigido | Impacto |
|---|----------|-------------------|---------|
| 1 | Server actions de produtos sem `requireAdminSession` | `features/admin/product-actions.ts` | **Segurança crítica** |
| 2 | Server actions de banners sem `requireAdminSession` | `features/admin/banner-actions.ts` | **Segurança crítica** |
| 3 | Server actions de planos/addons sem `requireAdminSession` | `features/admin/subscription-actions.ts` | **Segurança crítica** |
| 4 | `POST /api/upload` aberto sem autenticação | `app/api/upload/route.ts` | **Segurança crítica** |
| 5 | Stripe catch retornava `success: true` em falha | `features/checkout/actions.ts` | Bug de dados |
| 6 | Assinatura criada com `status: 'active'` antes do pagamento | `features/subscriptions/checkout-action.ts` | Integridade de dados |
| 7 | `any` types em checkout de assinatura | `features/subscriptions/checkout-action.ts` | Qualidade de código |
| 8 | Migration 00009 duplicava policy causando erro em `db reset` | `supabase/.../00009_product_recommendations_rls.sql` | Build/infra |
| 9 | Credencial real no `.env.example` | `apps/floricultura-web/.env.example` | **Segurança crítica** |
| 10 | `images.formats` ausente no next.config | `apps/floricultura-web/next.config.mjs` | Performance |
| 11 | Status de assinatura `pending_payment` inexistente no enum SQL | `supabase/.../00012_subscription_pending_status.sql` | Integridade de dados |
| 12 | Webhook Stripe usando strings literais em vez de constantes | `app/api/webhooks/stripe/route.ts` | Manutenibilidade |
| 13 | `react-hooks/exhaustive-deps` no AdminProductModal | `app/admin/produtos/AdminProductModal.tsx` | Lint |
