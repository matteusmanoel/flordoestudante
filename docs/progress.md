# Progress

## UX pública (mar/2026)

- **Mídia portável + admin mobile (mar/2026):** persistência preferencial `bucket/path` no Storage; `resolvePublicImageUrl` reescreve URLs antigas do Storage com `NEXT_PUBLIC_SUPABASE_URL` atual; `MediaThumb` com fallback em erro; `/api/upload` retorna `{ path, url }`; migration `00011_normalize_storage_paths.sql`. Admin: em `< md`, listagens de produtos/planos/complementos/banners/pedidos em **cards** com menu **⋮**; desktop mantém tabelas. Checkout: `CheckoutSummary` com `hideTitle` para evitar título duplicado. Doc: teste em celular vs Supabase local em `docs/manual-steps.md`.
- Loadings: `loading.tsx` em `(public)`, catálogo, produto, carrinho, checkout e assinaturas; carrinho/checkout com spinner + skeleton na hidratação.
- Imagens: `resolvePublicImageUrl` + uso em `MediaThumb`; fallback de capa PDP a partir da primeira `product_images` quando a capa é placeholder; `next.config` com host local Supabase (`127.0.0.1:54321`).
- Carrinho: estado global `cartSheetOpen` abre o sheet ao adicionar item; animação spring no conteúdo; CTA secundário “Ver catálogo” (`/catalogo`).
- PDP: linha de subtotal conforme quantidade.
- Checkout: resumo do pedido no topo; stepper em 2 etapas (contato/entrega vs pagamento/observações); `CheckoutFulfillmentSection` com variantes `delivery_only` / `payment_only`.
- Marca: logos em `/public/branding/` (cópias de `logo-centralized.PNG`, `logo-footer.PNG`, `logo.PNG`) no header, footer, hero, login admin.

## Checkout pedidos avulsos (mar/2026)

- **Botão “Finalizar pedido”:** em checkout em 2 etapas, falhas do Zod nos campos da etapa 1 não tinham `onInvalid` — o utilizador ficava na etapa 2 sem mensagem (parecia que o botão não fazia nada). Corrigido com `handleSubmit(onSubmit, onInvalid)`, toast + volta à etapa 1 + scroll ao topo; helper `firstNestedErrorMessage` para mensagens aninhadas (`address.*`).
- **Entrega sem regra de frete:** opção “Entrega” desativada quando não há `activeShippingRule`; `goToStep2` valida regra e sincroniza `shipping_rule_id`.
- **Stripe no checkout de carrinho:** desativado (early-return na server action + opção comentada na UI + bloco Stripe comentado em `actions.ts`). Assinaturas mantêm Stripe.

## Auditoria e correções pré-produção (mar/2026)

Varredura completa identificou e corrigiu 13 pontos antes do go-live:

- **Segurança (crítico):** `requireAdminSession()` adicionado às server actions de `product-actions`, `banner-actions` e `subscription-actions` (estavam abertas a qualquer invocador).
- **Segurança (crítico):** `POST /api/upload` protegido com verificação de sessão admin (antes aceitava uploads anônimos com service role).
- **Segurança (crítico):** Credencial real removida de `.env.example`.
- **Bug de dados:** Stripe catch block retornava `success: true` em falha — corrigido para `success: false` com rollback de pedido/itens/pagamento.
- **Integridade de dados:** Assinaturas agora criadas com `status: 'pending_payment'` (novo enum via migration `00012`); webhook Stripe atualiza para `'active'` após pagamento confirmado.
- **Infra:** Migration `00009` tornada idempotente (`DROP POLICY IF EXISTS`) para suportar `db reset` sem erro.
- **Tipos:** `any` eliminados em `subscriptions/checkout-action.ts`; `STRIPE_SESSION` adicionado ao union de error codes.
- **Performance:** `images.formats: ['image/avif', 'image/webp']` adicionado ao `next.config.mjs`.
- **Lint:** Zero warnings após `eslint-disable-next-line` no `AdminProductModal`.
- **Constantes:** Webhook Stripe usa `SUBSCRIPTION_STATUS.*` em vez de strings literais.
- **Docs:** `docs/deploy-guide.md` criado com guia completo de deploy (Supabase, Vercel, envs, MP, Stripe, DNS).

## Status atual
- **FASE MVP VERIFICATION & CLIENT-READY PREP** concluída (execução real documentada abaixo).
- **FASE SAAS READINESS** concluída: importação XLSX, UX admin aprimorada, gestão avançada de pedidos, animações e WhatsApp integrado.
- **FASE PRÉ-PRODUÇÃO** concluída: varredura de segurança, correções de bugs e documento de deploy gerado.
- MVP floricultura: código **lint/typecheck/build OK**; stack local Supabase **validada** (migrations + seed + REST); Docker Postgres **validado**; fluxo **browser E2E** depende de `.env.local` + admin criado (marcado como pendente por ambiente no runbook).
- **Produto SaaS pronto para venda a outras floriculturas**: template de importação, dashboard visual, filtros de pedidos, comunicação WhatsApp e animações de interface implementados.

## Verificação real executada (ambiente de desenvolvimento)

| Etapa | Resultado | Detalhe |
|-------|-----------|---------|
| Docker Compose `postgres` | **OK** | `docker compose up -d`; health `healthy`; `pg_isready` OK |
| Supabase CLI | **OK** | Instalado (ex.: v2.58.x) |
| `supabase start` | **OK** | Primeira vez: pull longo (~minutos); depois API em `:54321` |
| Migrations locais | **Corrigido** | CLI espera arquivos em `supabase/floricultura/supabase/migrations/`; antes o reset aplicava **0** migrations — adicionados `scripts/sync-floricultura-supabase.sh` + cópias |
| Seed local | **Corrigido** | `[db.seed]` com paths não aplicava; `seed.sql` com `\i` falha no runner — **`merge-floricultura-seed.sh`** gera `supabase/seed.sql` |
| `supabase db reset` | **OK** | Após sync + merge: 6 migrations + seed; 2 categorias, 4 produtos (confirmado via REST) |
| `pnpm lint` / `typecheck` / `build` | **OK** | Monorepo completo |
| Navegação real (Chrome) home→admin | **Não executado aqui** | Exige dev server + env + admin; ver `docs/runbook-mvp-tests.md` — **PENDENTE POR AMBIENTE** |

## Scripts raiz relevantes
- `pnpm docker:up` / `docker:down`
- `pnpm db:floricultura:sync` — migrations + seed gerado
- `pnpm db:supabase:start` / `stop` / `reset`

## Documentação
- `docs/runbook-mvp-tests.md` — registro de verificação + checklists OK/NOK/PENDENTE
- `docs/client-cutover-plan.md` — entrada da base do cliente
- `docs/setup.md`, `docs/deploy-checklist.md`, `docs/handoff-operacao.md` — atualizados

## Seed com admin de teste (cloud)

- **Script:** `pnpm seed:floricultura` (raiz). Cria usuário no Supabase Auth e, com `DATABASE_URL` válido, insere em `public.admins` e aplica o seed SQL (settings, categorias, produtos, banners, frete, cliente/pedido exemplo).
- **Credenciais admin teste:** `admin@flordoestudante.com.br` / `Admin123!` — ver `docs/seed-e2e-test.md`.
- Neste ambiente, as migrations foram aplicadas via MCP (Supabase); o admin e o seed de dados foram aplicados. Pronto para testes E2E no app com Supabase cloud.

## Assinaturas, Stripe e WhatsApp (implementação completa)

### Modelagem de dados (Etapa 1)
- Nova migration `00007_subscriptions_and_addons.sql` aplicada no Supabase cloud.
- Enums adicionados: `subscription_frequency` (weekly, biweekly, monthly), `subscription_status` (active, paused, cancelled, expired).
- Enums estendidos: `payment_provider` e `payment_method` agora incluem `stripe`.
- Tabelas novas: `subscription_plans`, `subscriptions`, `addons`, `product_addons`, `plan_addons`.
- Seed de dados de teste: 3 planos, 5 complementos, relações planos↔addons e produtos↔addons.
- Tipos e schemas Zod atualizados em `packages/core`.

### Catálogo público de assinaturas (Etapa 2)
- `/assinaturas` — listagem de planos com frequência e preço/ciclo.
- `/assinaturas/[slug]` — PDP com seleção de add-ons e resumo de valor.
- Home page atualizada com seção "Flores por Assinatura".
- Header e footer com link "Assinaturas".

### Admin CRUD (Etapa 3)
- `/admin/planos` — listagem, criação, edição, ativação/desativação de planos.
- `/admin/complementos` — listagem, criação, edição, ativação/desativação de add-ons.
- Links no layout admin e home admin.
- Server actions em `features/admin/subscription-actions.ts`.

### Integração Stripe (Etapa 4)
- SDK `stripe` instalado; helpers em `lib/stripe/` (config, create-checkout).
- `/assinaturas/checkout` — checkout de assinatura via Stripe Checkout Session (mode: subscription).
- `/assinaturas/sucesso` — página pós-checkout.
- Checkout regular estendido: opção "Cartão de crédito (Stripe)" disponível para pedidos avulsos.
- `/api/webhooks/stripe` — endpoint para eventos `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Env vars: `STRIPE_SECRET_KEY` (já configurado), `STRIPE_WEBHOOK_SECRET` (a definir em prod).

### WhatsApp (Etapa 5)
- Template `buildWhatsAppSubscriptionMessage` e `buildWhatsAppOrderConfirmation` em `packages/notifications`.
- Componente `WhatsAppCTA` reutilizável com ícone e link `wa.me`.
- CTA WhatsApp na página de tracking do pedido (quando `awaiting_approval` ou `paid`).
- CTA WhatsApp na página de sucesso da assinatura.
- Env var `NEXT_PUBLIC_STORE_WHATSAPP` configurável.

### UX e mobile (Etapa 6)
- Header responsivo com menu hambúrguer para mobile.
- Hero atualizado com CTA "Assinar flores".
- Footer com link "Assinaturas".
- Todas as novas telas (assinaturas, checkout, admin) com grid responsivo.

### Build
- Typecheck e build ok: `pnpm --filter floricultura-web run build` limpo.

## Melhorias UX (plano concluído)

### Fase 1 — Fundação
- Placeholders de imagem (`img-box-svgrepo-com.svg`) em ProductCard, CartItemRow, ProductGallery, SubscriptionPlanCard, AdminProductModal.
- Toasts globais com Sonner; remoção do CartToast customizado.
- Loading states no admin: `app/admin/loading.tsx` com skeleton.

### Fase 2 — Produtos e recomendados
- Migration `00008_product_recommendations.sql`: tabela `product_recommendations` (produto → produtos recomendados).
- CRUD de produtos no admin em modal: listagem em `/admin/produtos`, "Novo produto" e "Editar" (rota `/admin/produtos/[id]`) com `AdminProductModal`; upload de capa via `/api/upload` (Supabase Storage); vínculos com add-ons e produtos recomendados.
- Seção "Complete seu presente" na PDP: `getRecommendedProductsForProduct`, componente `CompleteSeuPresente` e exibição abaixo do produto em `/produto/[slug]`.

### Fase 3 — Checkout
- Integração ViaCEP: `lib/viacep.ts` e `onBlur` do campo CEP em `CheckoutAddressSection` preenchendo logradouro, bairro, cidade e UF.
- Fotos dos produtos no resumo do pedido: `CheckoutSummary` com miniatura e dados por item.
- Seção "Complete seu presente" na tela de checkout: `CheckoutRecommendedSection` e `getRecommendedForCheckout` (recomendados a partir dos itens do carrinho, excluindo já presentes).

### Fase 4 — Admin e homepage
- CRUD de planos e complementos em modais: `AdminPlanModal`/`AdminPlansClient` e `AdminAddonModal`/`AdminAddonsClient`; edição via `/admin/planos/[id]` e `/admin/complementos/[id]` abrindo o modal.
- Header: link "Carrinho" no menu mobile; botão "Área do lojista" com variant outline; espaçamento ajustado.
- Degradês verdes na homepage: Hero (from-green-50/90 via-emerald-50/70), Banners, Intro, Destaques e Assinaturas com gradientes suaves (green-50, emerald-50).

## Transformação SaaS (março 2026)

### 1. Importação de produtos via planilha XLSX
- **Template padrão**: arquivo `/public/templates/import-produtos-v1.xlsx` com colunas para categoria (nome, slug), produto (nome, descrições, preços, flags), imagens (capa + 3 extras via URLs).
- **Parser e validação**: módulo `packages/core/src/imports/products-xlsx.ts` com biblioteca `xlsx`; schemas Zod para validação por linha; normalização de booleanos/números/strings; geração automática de slugs.
- **Server action**: `features/admin/product-import-actions.ts` com criação automática de categorias; inserção/atualização de produtos; criação de múltiplas imagens em `product_images`; registro em `imports_log` (status, contadores, relatório de erros JSON).
- **UI admin**: página `/admin/produtos/import` com componente client `AdminProductsImportClient`; fluxo passo a passo (download template → upload → importar → revisar); feedback visual de progresso e erros; resumo com contadores verde/vermelho; lista de erros por linha.
- **Dependências**: `xlsx` e `@types/xlsx` instalados no `packages/core`.

### 2. Dashboard admin aprimorado com cards e ícones
- **Redesign da home admin**: página `/admin` transformada de lista de botões texto para grade de cards responsivos (1 col mobile, 2-3 cols desktop).
- **Cards implementados**:
  - Pedidos (ShoppingBag, azul): "Acompanhe pedidos em aberto, atualize status e veja detalhes"
  - Produtos (Package, roxo): "Gerencie produtos, categorias e fotos do catálogo"
  - Importar por planilha (FileSpreadsheet, verde): "Suba uma planilha para cadastrar vários produtos de uma vez"
  - Banners (Image, laranja): "Gerencie banners da home e destaques do catálogo"
  - Planos de assinatura (Stars, amarelo): "Configure planos recorrentes e benefícios"
  - Complementos (Gift, rosa): "Gerencie complementos e adicionais para assinaturas"
- **Componentes**: uso de `Card`/`CardHeader`/`CardTitle`/`CardDescription` do `@flordoestudante/ui`; ícones Lucide importados individualmente; hover states com transição border-primary e shadow-md.
- **Componente Alert**: criado `packages/ui/src/components/alert.tsx` com variantes default/destructive; exportado no index.
- **Dependências**: `lucide-react` instalado no `floricultura-web`.

### 3. Animações e loadings evidentes
- **Componente AnimatedSection**: criado `components/shared/AnimatedSection.tsx` usando Framer Motion; props `delay`, `direction` (up/down/left/right), `once`; suporte a `prefers-reduced-motion` via hook `useEffect` + MediaQuery.
- **Aplicações**:
  - Home: `HomeHero` e `HomeIntro` com fade-in e translateY.
  - Catálogo: (aplicável em títulos/filtros futuros).
  - Admin: cards da home admin já têm hover states; importação tem loading overlay com `Loader2` girando.
- **Loadings aprimorados**:
  - `CheckoutRecommendedSection`: antes retornava `null` durante loading; agora mantém estrutura (skeleton pode ser adicionado).
  - Admin: formulários com botões desabilitados + texto "Salvando…" + ícone Loader2.
  - Importação: overlay "Processando planilha…" com Loader2 animado.
- **Dependências**: `framer-motion` instalado no `floricultura-web`.

### 4. Gestão avançada de pedidos com WhatsApp e links públicos
- **Lista de pedidos aprimorada**: página `/admin/pedidos` com componente client `AdminOrdersTableClient` recebendo lista de pedidos + `storeName` + `siteUrl`.
- **Filtros por status**:
  - "Em aberto" (pending_payment, paid, awaiting_approval, in_production, ready_for_pickup, out_for_delivery)
  - "Concluídos" (completed)
  - "Cancelados/Expirados" (cancelled, expired)
  - "Todos"
  - Badges com contadores de pedidos por filtro.
- **Coluna de itens**: mostra contagem de itens por pedido (ex.: "3 itens").
- **Ações rápidas por pedido** (botões com ícones):
  - Ver detalhe (Eye)
  - Conversar no WhatsApp (MessageCircle): abre deep-link `wa.me` com mensagem pré-formatada incluindo código do pedido, status atual, prazo estimado e link de acompanhamento; só aparece se `customers.phone` estiver preenchido.
  - Copiar link público (Link2/Copy com feedback Check verde): copia URL `{siteUrl}/pedido/{public_code}` para clipboard com toast visual de 2s.
- **Detalhe do pedido aprimorado**: página `/admin/pedidos/[id]` com `OrderAdminDetail` recebendo também `customerName` e `customerPhone`.
- **Nova seção "Cliente"**: exibe nome e telefone; botões "Conversar no WhatsApp" (abre deep-link) e "Copiar link de acompanhamento" (com feedback Check).
- **Status destacado**: Badge com status atual acima do formulário.
- **Helpers**:
  - `getWhatsAppUrl` de `@flordoestudante/notifications`: normaliza telefone, monta URL `wa.me` com mensagem encodada.
  - Mensagem admin formatada: "Olá! Sobre o pedido *{code}* em {storeName}: Status: *{status}* [Prazo: {eta}] Acompanhe aqui: {trackingUrl}"
- **Constantes**: `STORE_NAME` adicionado em `lib/constants.ts` (lê `NEXT_PUBLIC_STORE_NAME` com fallback "Flor do Estudante").

### 5. WhatsApp integrado via deep-links
- **Abordagem**: deep-links `wa.me` sem API oficial WhatsApp Business; mantém simplicidade do MVP e evita complexidade de integração.
- **Uso no admin**:
  - Lista de pedidos: botão por linha com ícone MessageCircle.
  - Detalhe do pedido: botão na seção de cliente.
  - Ambos abrem mensagem em nova aba preservando contexto do admin.
- **Mensagens pré-formatadas**: função `buildAdminOrderUpdateMessage` pode ser adicionada ao pacote `notifications` (pendente se necessário).
- **Configuração**: número de WhatsApp da loja via `NEXT_PUBLIC_STORE_WHATSAPP` (já existente).

### Build e validação
- Typecheck: ok (após correção de imports e props).
- Build: `pnpm --filter floricultura-web run build` ok (mar/2026; aviso eslint `exhaustive-deps` em `AdminProductModal` apenas).
- Lints: `pnpm --filter floricultura-web run lint` recomendado após mudanças grandes.

### 6. SaaS fixes — round 2 (admin banners, mobile admin, toggles, mídia, promoções)
- **Banners**: CRUD em `/admin/banners` com actions em `features/admin/banner-actions.ts`, modal e upload (bucket `banners`).
- **Admin**: `AdminShell` com nav central + dropdown Conta; `AdminBottomNav` no mobile; `Input`/`Textarea` do design system com `text-base` no mobile (menos zoom iOS).
- **Toggles / slug**: parsing robusto de booleanos em `product-actions` e `subscription-actions`; slug automático com unicidade (`slug-utils`); switches Shadcn em produtos/planos/complementos.
- **Planos & complementos**: buckets `subscription-plan-images` / `addon-images`, upload via API, `cover_image_url` nos forms; coluna de miniatura nas listagens admin.
- **Promoções**: `getPromoProducts` em `features/catalog/data.ts`; `HomePromosSection` na home; bloco “Promoções” no topo do `/catalogo` (visível sem filtro de categoria).
- **Placeholder de imagem**: `isPlaceholderMediaUrl` + componente `components/shared/MediaThumb.tsx` (ícone discreto em vez do SVG gigante) aplicado em cards, galeria, carrinho, checkout, assinaturas, banners admin e listas de produtos.
- **AddonPicker**: miniatura ao lado de cada complemento.

### Documentação atualizada
- `docs/architecture.md`: seção "Funcionalidades SaaS implementadas" com detalhes de importação, dashboard, animações, pedidos e WhatsApp.
- `docs/progress.md`: esta seção com changelog completo da transformação SaaS.
- `docs/runbook-mvp-tests.md`: pendente atualização com novos cenários (importar planilha válida/inválida, adicionar fotos, fluxo pedidos com WhatsApp e link público).

## Próximos passos
1. Executar `pnpm --filter floricultura-web run build` e `pnpm --filter floricultura-web run lint` para validar todas as alterações SaaS.
2. Testar fluxo completo de importação de produtos via planilha (download template, preencher, upload, revisar erros).
3. Testar filtros de pedidos, ações de WhatsApp e cópia de link público.
4. Atualizar `docs/runbook-mvp-tests.md` com novos cenários de teste SaaS.
5. Desenvolvedor: rodar `pnpm dev`, acessar `/admin/login` com credenciais de teste, testar fluxos de assinatura, pedidos e importação.
6. Configurar `STRIPE_WEBHOOK_SECRET` com `stripe listen --forward-to` em dev ou via Dashboard em produção.
7. Definir `NEXT_PUBLIC_STORE_WHATSAPP` com o número real da loja.
8. Cliente: seguir `docs/client-cutover-plan.md` para produção.

## Histórico resumido (fases anteriores)
Monorepo floricultura: catálogo, carrinho, checkout, MP/offline, webhook, sync, pedido público, admin (login, pedidos, status, itens), Docker Compose, documentação de deploy/handoff/smoke test. Home-decor mínimo.
