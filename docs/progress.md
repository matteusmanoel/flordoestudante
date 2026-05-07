# Progress

## Agente WhatsApp — Checkout + Entrega + PIX (mai/2026)

Implementação dos milestones M1–M3 do PRD `docs/agent-checkout-and-delivery-evolution.md`:

### M1 — Página de pagamento robusta + endpoint do agente
- **`features/payments/create-payment.ts`** (novo): função compartilhada `createMpPaymentForOrder` que insere `payments` row + cria preferência Mercado Pago. Usada por `finalizeCheckout`, `retryMercadoPagoPreference` e o novo endpoint.
- **`features/checkout/actions.ts`**: refatorado para usar `createMpPaymentForOrder`; removida duplicação de lógica de pagamento.
- **`features/payments/retry-preference-action.ts`**: agora cria payments row + MP preference se não existir (pedidos vindos do agente não tinham row — corrigido).
- **`features/payments/data-order.ts`**: `OrderPaymentView` enriquecida com `giftMessage`, `addressSnapshot` (street, number, complement, neighborhood, city, state, postalCode, recipientName).
- **`app/(public)/pedido/[codigo]/pagamento/PedidoPagamentoClient.tsx`**: reescrito — mostra itens, endereço de entrega, mensagem do cartão; trata `payment === null` como "aguardando pagamento" acionando auto-retry; suporta offline, expirado, pago e status genérico.
- **`app/api/agent/prepare-payment/route.ts`** (novo): `POST` autenticado por `x-agent-secret`; cria payments row + MP preference para pedidos do agente; retorna `checkout_url`, `mp_init_point` e dados PIX estáticos (env).

### M2 — Workflow n8n: cabeamento endpoint + PIX direto
- **`HTTP: PREPARE CHECKOUT | S6`**: URL migrada de `flor_prepare_checkout` (Supabase RPC) para `/api/agent/prepare-payment`. Body usa `public_code` em vez de `order_id`. Autenticação via `x-agent-secret` (variável `$vars.AGENT_SHARED_SECRET`).
- **`CODE: MERGE CHECKOUT | S6`**: usa `mp_init_point` do endpoint; monta `agent_messages` com segunda mensagem PIX (chave, valor, instruções) quando `pix` estiver configurado. Dados PIX via `pix_message` que já entra no pipeline `EXPLODE MENSAGENS WHATSAPP`.

### M3 — CEP, área de entrega e taxa R$20
- **`supabase/floricultura/migrations/00026_shipping_rules_and_store_config.sql`**: upsert da regra de entrega "Capitão Leônidas Marques" com amount=20.00; metadata com allowed_cities, allowed_states, prefixo CEP 85790, endereço da loja.
- **Prompt `CODE: PREPARA PROMPT | S6`** (workflow): regras adicionadas:
  - REGRA DE MULTI-INTENÇÃO: responder todas as dúvidas antes de avançar para finalização.
  - REGRA DE CHECKOUT: lista explícita de palavras-gatilho (finalizar, fechar, confirmar, pagar, gerar link, pix...).
  - RESTRIÇÃO GEOGRÁFICA: entrega somente em Capitão Leônidas Marques (CEP 85790-xxx), taxa R$20. Se CEP fora da área, oferecer retirada.
  - REGRA DE NÃO-REPETIÇÃO DE ENDEREÇO: uma vez confirmado, não solicitar novamente.
  - FLAG `address_already_confirmed` no USER_CONTEXT baseada em fulfillment_type + address no contexto do pedido.

### Decisões técnicas
- Endpoint `/api/agent/prepare-payment` é idempotente: se já houver `payments` row com `mp_init_point`, retorna sem criar nova.
- PIX configurado via env `STORE_PIX_KEY`, `STORE_PIX_KEY_TYPE`, `STORE_PIX_HOLDER_NAME` (não precisa de migration).
- `AGENT_SHARED_SECRET` protege o endpoint contra chamadas externas.

### Próximos passos (M4–M6)
- M4: Comprovante PIX → handoff automático para humano.
- M5: Validação de CEP via ViaCEP no workflow (nó de lookup + nó de validação de cidade).
- M6: Testes end-to-end do fluxo agente → checkout → pagamento.

---

## Reset de senha via Supabase Auth (mai/2026)

- **API `POST /api/auth/reset-request`** valida e-mail com Zod e dispara `supabase.auth.resetPasswordForEmail` via cliente service role (`apps/floricultura-web/lib/supabase/server-service.ts`); resposta sempre 200 com mensagem neutra para preservar privacidade. `redirectTo` aponta para `${NEXT_PUBLIC_SITE_URL}/auth/reset?target=admin|customer`.
- **Página `/auth/reset`** (Suspense + client) detecta `code` na query: sem code, mostra formulário de e-mail; com code, faz `exchangeCodeForSession` e abre form de nova senha (`updateUser({ password })`). Estados: validando, sucesso, link inválido/expirado (lê `error_code`/`error_description`).
- **Login admin** ganhou link "Esqueci minha senha" → `/auth/reset?target=admin` em `apps/floricultura-web/components/admin/AdminLoginForm.tsx`.
- **Manual steps** atualizados: Site URL/Redirect URLs no Supabase Auth e nota sobre o template "Reset Password" usar o remetente gratuito `noreply@mail.app.supabase.io` (`docs/manual-steps.md`).

## Upgrade UI/UX Premium — "O Melhor Site de Floricultura" (mai/2026)

7 milestones implementados com TypeScript limpo (tsc --noEmit ✅):

- **M1 — Fundação Visual:** Playfair Display adicionada como `--font-display` / `font-display`; paleta refinada com rose/blush accent (`--accent: 348 55% 94%`); fundo mais quente (`--background: 38 40% 98%`); `tailwind.config.ts` com `fontFamily.display`, `borderRadius.2xl`, animações `fade-up / scale-in / slide-in-right`; utilitários `.scrollbar-none`, `.bg-floral-gradient`, `.editorial-label`, `.section-divider` em `globals.css`.

- **M2 — ProductCard v2:** Aspect ratio `4/3` → `3/4` (portrait); nome usa `font-display`; hover overlay com botão circular de quick-add; badges "Destaque" e "Promoção"; sombra suave no hover; `ProductCardSkeleton` atualizado; short description removida do card.

- **M3 — Carrosséis por Categoria:** `CategoryCarousel.tsx` — carrossel com `scroll-snap`, setas prev/next no desktop, `ResizeObserver` para estado dos botões; `CategoryCarouselSection.tsx` — seção com título da categoria e "Ver todos →"; `HomeCatalogSection.tsx` reescrito para usar `getProductsByCategory()`; nova função `getProductsByCategory()` em `features/catalog/data.ts` (agrupada por categoria, máx. 10 itens/cat, máx. 8 categorias).

- **M4 — Homepage Editorial:** `HomeHero.tsx` — layout 2 colunas assimétricas (imagem editorial esquerda, texto direita), mobile com overlay, fallback com SVG botânico; `HomeTrustBar.tsx` — barra de confiança com 4 trust signals; `HomeOccasionTiles.tsx` — 6 tiles por ocasião com emoji e cor temática; `HomeBanners.tsx` — aspect 16/7, overlay gradiente bottom-to-top, `font-display`; `HomeIntro.tsx` — editorial label + display font; `page.tsx` reordenado com novas seções.

- **M5 — PDP Premium:** `ProductSummary.tsx` — textarea de gift message (fundo accent/blush, ícone Gift, contador 200 chars) antes do CTA; seletor visual entrega/retirada (radio cards com ícone); CTA principal "Enviar este presente" com ícone; seção de descrição com título editorial; `ProductGallery.tsx` — thumbnails 80×80 com border-primary selecionado e opacidade reduzida, dots indicator mobile.

- **M6 — Navegação:** `app/(public)/layout.tsx` — busca categorias no servidor e passa ao header; `PublicHeader.tsx` reescrito com: sub-nav de categorias em desktop, barra de busca toggle (expand/collapse), menu mobile com grid 2 colunas de categorias + link WhatsApp + Área do lojista; aceita `categories: CategoryCard[]` como prop.

- **M7 — Checkout & WhatsApp:** `CartItem.giftMessage?: string` adicionado ao tipo; `createCartItem` aceita `giftMessage`; `mergeItemIntoCart` preserva/atualiza gift message; `addItem(product, qty, giftMessage?, options?)` — store atualizado; `CartItemRow` mostra preview itálico da mensagem com ícone de presente; `CheckoutNotesSection` — gift message elevado com painel accent/blush e ícone Gift; `WhatsAppFAB.tsx` — FAB flutuante verde `#25D366`, aparece após 1.2s com animação, hover scale; adicionado ao layout público; `CompleteSeuPresente` corrigido para nova assinatura do `addItem`.

## UX Polish Sprint (mai/2026)

9 grupos implementados com TypeScript limpo (tsc --noEmit ✅):

- **G1 — CheckoutAddressSection:** Accordion pós-CEP — campos CEP/Número sempre visíveis; campos de endereço completo (Rua|UF, Bairro|Cidade, Complemento|Referência em grid-cols-2) expandem automaticamente ao preencher CEP com 8 dígitos. Hint "Preencher manualmente" para acesso manual.

- **G2 — CartSheet:** Substituição completa por portal React personalizado (sem Radix Sheet). Overlay suave `bg-black/25 backdrop-blur-[2px]`. Painel animado com `framer-motion` (spring `x: 100% → 0`, mass 0.85). `body.overflow: hidden` durante abertura. Botão fechar no header do painel.

- **G3 — ProductSummary CTA:** Botão "Adicionar Carinho" com ícone `HeartPlus` do lucide-react, `rounded-full`, grupo hover com escala 125% no ícone. Quantidade + CTA em `grid-cols-2` com selector pill-shaped (`rounded-full border`).

- **G4 — CheckoutForm:** Removido `CheckoutStepper` e botão "Voltar ao carrinho". Headline editorial "Preparando algo especial" na página. Layout desktop `grid-cols-[1fr_380px]` com summary sticky na coluna direita. Espaçamento reduzido (`space-y-5`). Resumo mobile acima do form. Seções individuais em cards `p-4`. `CheckoutRecommendedSection` abaixo do form.

- **G5 — Persistência de estado:** `preferredFulfillment` adicionado ao `CartStore` com persistência `localStorage ('flor_fulfillment')`. `setPreferredFulfillment` chamado no `ProductSummary` ao escolher entrega/retirada. `CheckoutPageClient` extrai `firstGiftMessage` + `preferredFulfillment` do store e passa como `initialGiftMessage`/`initialFulfillment` para `CheckoutForm`. `defaultValues` do form pré-preenchidos.

- **G6 — Payment Tabs:** `CheckoutFulfillmentSection` redesenhado com tabs custom (sem RadioGroup). Indicador deslizante `motion.div` com `layoutId="payment-tab-indicator"` e spring animation. Background verde suave (`bg-green-50 border-green-200`) na tab selecionada. Texto verde (`text-green-700`).

- **G7 — HomeBanners Carrossel:** `HomeBanners.tsx` virou server component que passa todos os banners para `HomeBannersCarousel.tsx` (client). Carrossel com `translateX` CSS, auto-advance a cada 4.5s com pause on hover, dots de navegação animated (pill ativo, círculo inativo), botões prev/next. Banners clicáveis via `ctaHref`.

- **G8 — Header + Transições:** `usePathname` adicionado ao `PublicHeader` para detectar rota ativa. Links ativos com `font-medium text-foreground` + `motion.span` animado (`layoutId="nav-active-indicator"`) como underline. Mobile: link ativo com `bg-muted/60`. `PageTransitionWrapper.tsx` criado com `AnimatePresence mode="wait"` + `motion.div` (opacity + y). Integrado no `app/(public)/layout.tsx`.

- **G9 — Admin:** `AdminProductModal` expandido para `sm:max-w-3xl`, form em `grid grid-cols-2` (campos à esquerda, imagem/switches/relações à direita). Botão "Excluir produto" (vermelho) com confirmação inline (`confirmDelete` state). Chama `deleteProduct` server action. Pedido: `app/admin/pedidos/[id]/page.tsx` renderiza `OrderAdminDetailModal.tsx` (client) que abre `Dialog` automaticamente; fechar navega para `/admin/pedidos`. `OrderAdminDetail` removeu link "← Lista" (desnecessário na modal).

---

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

## Agente WhatsApp — Implementação Completa (mai/2026)

Implementação de ponta a ponta do agente conversacional WhatsApp/Instagram
sobre n8n + Redis + Supabase + OpenAI/OpenRouter. Cobre Sprints 4–13.

### Credenciais expostas — AÇÃO URGENTE
- Supabase service_role JWT e Evolution API key estavam hardcoded no Sprint 3A.json
- Documento de rotação criado em `docs/SECRETS-ROTATION-REQUIRED.md`
- Sprint 4A em diante usa apenas placeholders `COLE_AQUI_*`

### Migrations backfill (Sprints 1–3) — 00013 a 00017
- `00013_agent_conversations.sql`: tabelas `conversations`, `conversation_messages`, `agent_events`; campos de canal em `customers` e `orders`; RLS + triggers
- `00014_agent_product_fields.sql`: campos de busca/disponibilidade/tags em `products` e `addons`
- `00015_catalog_agent_views.sql`: views `vw_agent_catalog_products`, `vw_agent_addons`, `vw_agent_catalog_items`, `vw_agent_catalog_readiness`; funções `search_full_catalog_for_agent`, `search_ready_catalog_for_agent`, `match_catalog_item_for_agent`; tabelas `catalog_item_aliases`, `catalog_import_batches`, `catalog_import_items`
- `00016_inbound_sprint3_rpc.sql`: RPC `flor_register_inbound_sprint3` (upsert customer/conversation, reply determinístico)
- `00017_agent_context_rpc.sql`: RPCs `flor_get_conversation_context` e `flor_register_agent_exchange` (para Sprint 5+)

### Migrations Sprint 8–11 — 00018 a 00020
- `00018_flor_order_draft_tools.sql`: relaxa `NOT NULL` em `fulfillment_type`/`payment_method`; RPCs `flor_create_order_draft` e `flor_update_order_draft`
- `00019_flor_cart_parser.sql`: RPC `flor_parse_whatsapp_cart` (match catalog, catalog_import_batches)
- `00020_flor_handoff_tools.sql`: RPC `flor_trigger_handoff`; views `vw_admin_conversations` e `vw_admin_whatsapp_orders`; RPCs `flor_admin_assume_conversation` e `flor_admin_release_conversation`

### Workflows n8n
- `Sprint 4A Redis Buffer.json`: responseMode onReceived, Redis buffer+anti-duplicidade+human_lock, wait 2s debounce, graceful fallback se Redis fora, placeholders para todos os secrets
- `Sprint 5A IA Agent.json`: tudo do 4A + contexto Supabase + prompt Julia + OpenAI/OpenRouter (json_object) + parse/fallback + Switch de 6 actions (search_catalog, create_order_draft, update_order_draft, parse_whatsapp_cart, handoff_human, default) + envio de imagem Evolution + Redis session

### Documentação
- `docs/SECRETS-ROTATION-REQUIRED.md`: checklist de rotação de credenciais e configuração n8n
- `docs/agent-crm-queries.md`: queries SQL, RPCs e endpoints Next.js para CRM mínimo (Sprint 12)
- `docs/agent-test-matrix.md`: 25 cenários de teste de regressão com checklist detalhado (Sprint 13)

### Decisões técnicas
- Buffer debounce de 2s via Redis (flor:buffer, flor:last_msg_id) — evita resposta múltipla por mensagem fragmentada
- human_lock Redis (flor:human_lock) — bloqueia agente durante atendimento humano; TTL 8h
- Switch n8n com convergência: todos os branches do action router convergem para o mesmo nó REDIS SET SESSION sem Merge node (n8n permite múltiplas entradas em um único nó)
- RPC SECURITY DEFINER para todas as operações privilegiadas
- Prompt sistema com schema JSON forçado e 10 regras absolutas; fallback seguro se parse falhar

### Próximos passos (pós Sprint 5A — substituídos por Sprint 6A)

**URGENTE**: Rotacionar Supabase service_role key e Evolution API key (ver `docs/SECRETS-ROTATION-REQUIRED.md`)

---

## Sprint 6A — Multimodal Mothers Day Sales Agent (mai/2026)

### Status: IMPLEMENTADO — aguardando deploy e teste

### Problema raiz resolvido: Schema Drift

As migrations `00013–00020` criadas durante Sprints 4-13 descrevem um schema que **nunca foi aplicado** ao banco de produção atual. O banco live (`nldwghtcewsgrzkbxcyx`) mantém o schema original da Sprint 3, com colunas divergentes:

| Tabela | Migrations 00013-00020 assumiam | Schema real no banco |
|---|---|---|
| `conversation_messages` | `message_text`, `sent_at`, `customer_id` | `body`, `created_at`, `sender_type` |
| `agent_events` | `payload_json`, `stage_before/after` | `input_json`, `output_json`, `error_json` |
| `conversations` | `remote_jid`, `context_json` | `external_contact_id`, `metadata_json` |

**Decisão**: `00013–00020` permanecem intactas no repositório mas **NÃO DEVEM SER APLICADAS** ao banco atual. As migrations válidas são `00021–00023`.

### Migrations criadas (aplicar em ordem)

| Migration | Conteúdo | Aplicar? |
|---|---|---|
| `00021_flor_core_agent_rpcs_v2.sql` | `flor_get_conversation_context`, `flor_register_agent_exchange`, `flor_log_media_event` — schema real, SECURITY DEFINER | ✅ SIM |
| `00022_flor_order_and_sales_rpcs_v2.sql` | `flor_create_order_draft`, `flor_update_order_draft`, `flor_prepare_checkout`, `flor_parse_whatsapp_cart`, `flor_trigger_handoff` — corrigidas | ✅ SIM |
| `00023_flor_media_and_mothers_day.sql` | ADD COLUMN `transcription`/`visual_description` em `conversation_messages`; tags `dia_das_maes`; settings agent | ✅ SIM |
| `00024_security_rls_policies.sql` | Políticas RLS propostas — comentadas | ⏸️ NÃO (revisar antes) |
| `00013–00020` | Schemas divergentes do estado atual | ❌ NÃO APLICAR |

### Workflows criados

- `Sprint 6A Multimodal Mothers Day Sales.json` — **50 nodes**, importar como principal
  - Todos os secrets via `$vars.*` — zero hardcode
  - Buffer Redis idêntico ao Sprint 4A (anti-duplicidade, human_lock, onReceived)
  - Branch de áudio: Evolution getBase64 → n8n native OpenAI Transcribe (typeVersion 1.7)
  - Branch de imagem: extração URL → OpenRouter Vision HTTP (URL-based, mais estável que native)
  - Prompt Dia das Mães, venda autônoma, `prepare_checkout` como action oficial
  - Fix bug Sprint 5A: `CODE: RESOLVE REPLY` lê `agent_reply` de forma explícita antes de ENVIA EVOLUTION
  - `flor_register_agent_exchange` passa `p_agent_action = prepare_checkout` para rastreabilidade completa
- `FLOR | Tool Search Catalog.json` — subworkflow standalone (para modularização futura)
- `FLOR | Tool Media Process.json` — subworkflow standalone (áudio + imagem, para modularização futura)

### Decisões técnicas Sprint 6A

- **Node OpenAI nativo para áudio**: `n8n-nodes-base.openAi` typeVersion 1.7 com `audio:transcribe` — suportado em n8n Cloud 2.13.2. Requer binary data da etapa anterior.
- **Vision via HTTP OpenRouter**: Vision com `image_url` content type é mais estável via HTTP do que pelo node nativo OpenAI em 2.13.2 (node nativo não tem suporte a image_url content type na versão atual).
- **Chat completions via HTTP OpenRouter**: mantido por estabilidade do JSON mode.
- **Subworkflows inline**: media e catálogo ficam inline no workflow principal para evitar dependência de IDs de workflow em ambiente cloud.
- **`prepare_checkout`**: presente em prompt, schema JSON, Switch, parser/validator, test matrix e `flor_register_agent_exchange`.
- **RLS separado**: `00024` gerado mas com tudo comentado — aplicar só após validação completa do admin/CRM.

### Checklist de configuração para deploy

1. **Rotacionar credenciais** (ver `docs/SECRETS-ROTATION-REQUIRED.md`)
2. **Aplicar migrations em ordem**: `00021` → `00022` → `00023` via Supabase Dashboard SQL Editor
3. **Configurar variáveis de workflow no n8n** (Settings > Variables):
   - `SUPABASE_URL` = `https://nldwghtcewsgrzkbxcyx.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = nova key após rotação
   - `EVOLUTION_BASE_URL` = `https://cheatingbat-evolution.cloudfy.live`
   - `EVOLUTION_INSTANCE` = nome da instância
   - `EVOLUTION_API_KEY` = nova key após rotação
   - `OPENAI_API_KEY` = chave OpenAI (para Whisper nativo)
   - `OPENROUTER_API_KEY` = chave OpenRouter (para chat + vision)
   - `CATALOG_BASE_URL` = URL do app (ex: `https://flordoestudante.vercel.app`)
4. **Configurar credencial OpenAI** no n8n (para o node nativo de transcription): nome `"OpenAI Flor (configurar)"`, tipo `OpenAI API`
5. **Importar Sprint 6A** no n8n (não deletar 3A/4A/5A — manter histórico)
6. **Testar** com os 15 cenários do Sprint 6A em `docs/agent-test-matrix.md` (cenários 26–40)

### Rotas Next.js confirmadas

- `/produto/[slug]` ✅ `app/(public)/produto/[slug]/page.tsx`
- `/pedido/[codigo]` ✅ `app/(public)/pedido/[codigo]/page.tsx`
- `/pedido/[codigo]/pagamento` ✅ `app/(public)/pedido/[codigo]/pagamento/page.tsx`
- `flor_prepare_checkout` gera URL: `{CATALOG_BASE_URL}/pedido/{public_code}/pagamento`

### Riscos remanescentes

| Risco | Mitigação |
|---|---|
| Whisper nativo exige credential OpenAI configurada no n8n | Criar e configurar antes do teste |
| Evolution `getBase64FromMediaMessage` pode retornar formato inesperado | `continueOnFail` + fallback em `CODE: MERGE AUDIO` |
| `search_ready_catalog_for_agent` pode não existir ou ter assinatura diferente | Validar via Supabase MCP antes de aplicar; ajustar parâmetros se necessário |
| `flor_prepare_checkout` usa enum `payment_method` — valor deve estar no enum | Verificar enum no banco antes de chamar com `mercado_pago`/`pay_on_delivery` |
| Catálogo sem occasion_tags dia_das_maes impacta busca | Migração 00023 faz UPDATE nos produtos ativos existentes |

## Histórico resumido (fases anteriores)
Monorepo floricultura: catálogo, carrinho, checkout, MP/offline, webhook, sync, pedido público, admin (login, pedidos, status, itens), Docker Compose, documentação de deploy/handoff/smoke test. Home-decor mínimo.

---

## Sprint MVP Ready — Conclusão técnica do agente (06/05/2026)

### Status: MVP TÉCNICO COMPLETO — Aguardando deploy e testes

### O que foi feito

#### Diagnóstico MCP (live DB)
- Validado schema real via Supabase MCP (project `nldwghtcewsgrzkbxcyx`)
- Confirmado: apenas migrations 00001–00008 aplicadas; 00009–00024 nunca aplicadas
- Todas as 8 RPCs do agente estavam ausentes no banco
- Identificados 4 bugs críticos de nomes de coluna no migration 00022:
  - `orders.conversation_id` → `source_conversation_id`
  - `orders.notes` → `customer_note`
  - `shipping_rules.fixed_amount` → `amount`
  - `conversations.status = 'waiting_human'` → `'pending'` (valor válido)
- Identificado bug no migration 00023: `INSERT INTO settings (key, value, description)` — settings não tem coluna `key`
- Confirmada assinatura real de `search_ready_catalog_for_agent`
- Confirmadas rotas Next.js: `/produto/[slug]`, `/pedido/[codigo]`, `/pedido/[codigo]/pagamento`

#### Arquivos criados/alterados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `supabase/floricultura/migrations/00025_flor_mvp_agent_rpcs.sql` | NOVO | Migration consolidada com todas as 8 RPCs corrigidas + colunas de mídia |
| `workflows/FLOR \| WhatsApp Inbound Principal \| MVP Ready.json` | NOVO | Workflow principal 50 nodes, normalizer S3A robusto, todas branches convergindo |
| `workflows/FLOR \| Tool Search Catalog \| MVP.json` | NOVO | Subworkflow catálogo com assinatura real da RPC |
| `workflows/FLOR \| Tool Media Process \| MVP.json` | NOVO | Subworkflow Whisper (áudio) + OpenRouter Vision (imagem) |
| `docs/agent-test-matrix.md` | ATUALIZADO | Cenários 14/15 corrigidos + 20 novos cenários MVP (M01–M20) |
| `docs/progress.md` | ATUALIZADO | Este documento |
| `docs/mvp-agent-deploy-checklist.md` | NOVO | Checklist completo de deploy |
| `docs/SECRETS-ROTATION-REQUIRED.md` | ATUALIZADO | Service_role key hardcoded no Sprint 3A |

#### Correções aplicadas na Migration 00025
- `flor_get_conversation_context` — correto do 00021, aplicado
- `flor_register_agent_exchange` — correto do 00021, persistência de transcription/visual_description adicionada
- `flor_log_media_event` — correto do 00021, aplicado
- `flor_create_order_draft` — corrigido: `source_conversation_id`, `customer_note`, `amount`
- `flor_update_order_draft` — corrigido: `customer_note`, `amount`
- `flor_prepare_checkout` — correto do 00022, aplicado
- `flor_parse_whatsapp_cart` — correto do 00022, aplicado
- `flor_trigger_handoff` — corrigido: `status = 'pending'` (não `'waiting_human'`)
- Adicionado: `ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS transcription, visual_description`
- Adicionado: tag dia_das_maes em produtos ativos (idempotente)
- Removido: bug de `INSERT INTO settings (key, value, description)` do 00023

#### Correções aplicadas no Workflow MVP Ready
- Normalizer: `const payload = $json.body || $json` (bug S6A corrigido)
- Phone normalization: função robusta `normalizeBrazilWhatsappPhone` do Sprint 3A restaurada
- `continueOnFail: true` em todos os nodes Redis e Evolution
- Todas as 7 branches do SWITCH ACTION convergem para `CODE: NORMALIZA SAÍDA FINAL | MVP`
- `agent_reply` sempre sourced de `CODE: NORMALIZA SAÍDA FINAL | MVP` (não do Redis SET SESSION)
- Supabase HTTP Requests com headers `Accept-Profile: public` e `Content-Profile: public`
- `search_ready_catalog_for_agent` com assinatura real correta
- `flor_register_agent_exchange` com parâmetros corretos (`p_message_body`, não `p_message_text`)
- Human lock TTL: 28800 (8h), não 3600

### O que resta fazer antes de ir para produção

1. **Aplicar migration 00025** via Supabase MCP ou Dashboard SQL Editor
2. **Rotacionar credenciais** (ver `docs/SECRETS-ROTATION-REQUIRED.md`)
3. **Configurar no n8n:**
   - Variáveis: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `EVOLUTION_BASE_URL`, `EVOLUTION_INSTANCE`, `CATALOG_BASE_URL`, `OPENROUTER_API_KEY`
   - Credential Redis: `redis_cloudfy`
   - Credential OpenAI: `OpenAI Flor` (para Whisper)
   - Credential Evolution: header auth com `apikey`
4. **Importar workflows** na ordem: Tool Search Catalog MVP → Tool Media Process MVP → MVP Ready
5. **Ativar** apenas o MVP Ready; manter 3A/4A/5A/6A desativados como histórico
6. **Executar matriz de testes** (cenários M01–M20 + cenários 32–40)

### Riscos remanescentes

| Risco | Impacto | Mitigação |
|---|---|---|
| `flor_prepare_checkout` não cria registro em `payments` | Pagamento não rastreado no banco | MVP manual OK; criar payment após webhook MP pagar |
| OpenRouter Vision com base64 inline pode ser limitado | Imagens não analisadas | `continueOnFail` + fallback pede descrição |
| Evolution `getBase64FromMediaMessage` formato variável | Áudio/imagem não processa | `continueOnFail` + fallback em ambos os branches |
| Catálogo com 3 produtos no banco (seed mínimo) | Poucas opções para cliente | Adicionar produtos reais antes dos testes |
| `CATALOG_BASE_URL` precisa ser URL final após deploy | Links incorretos em testes locais | Configurar via `$vars` no n8n |
| RLS desativado em conversations/messages/agent_events | Exposição de dados via anon key | Revisar e aplicar 00024 com policies corretas antes de expor publicamente |

---

## UX Polish Sprint 2 (mai/2026)

Segundo ciclo de refinamentos de UX focado em microinterações de clique, checkout, página pública de pedido, imagens quebradas e campanha de Dia das Mães.

### Grupos implementados

#### G1: Cursor pointer em todas as áreas clicáveis
- Adicionado CSS global para garantir `cursor: pointer` em botões, links e elementos interativos
- Aplicado em `apps/floricultura-web/app/globals.css`

#### G2: CTA "Finalizar Pedido" — copy e estilização
- Atualizado texto para "Confirmar pedido com carinho"
- Adicionado ícone `HeartHandshake` com animação
- Tamanho `lg`, `rounded-full`
- Microanimação `hover:scale-[1.02]`
- Estado de loading: "Finalizando com carinho…"

#### G3: Alinhamento do topo Resumo do Pedido com Contato no checkout
- Aplicado `lg:items-start` no grid do checkout
- Resumo e form agora alinham no mesmo nível Y no desktop

#### G4: Redirecionamento pós-compra e otimização da página pública de pedido
- `CheckoutForm` agora redireciona para `/pedido/[code]` (não `/pagamento`)
- **Novo componente**: `OrderProgressBar` com barra de progresso horizontal
  - 5 etapas: Aguardando aprovação → Aprovado → Sendo preparado → Pronto/Saiu → Concluído
  - Etapa atual com `animate-pulse` e `shadow-lg shadow-primary/40`
  - Etapas completadas com checkmark verde
- `OrderItemsList` agora exibe fotos dos produtos
  - Query de `getOrderPaymentView` atualizada para buscar `product_id` e `cover_image_url`
  - Fallback visual com ícone para produtos sem imagem
- Página pública agora mostra:
  - Mensagem de agradecimento para pedidos novos
  - Barra de progresso destacada
  - Lista de itens com foto, nome, quantidade e preço
  - Resumo financeiro sticky no desktop

#### G5: Investigação e correção das imagens ausentes na PDP/miniaturas
- Adicionado tratamento para strings vazias ou inválidas (`'null'`, `'undefined'`) em `resolvePublicImageUrl`
- `ProductGallery` refatorado:
  - Filtra imagens vazias da lista
  - Garante fallback para placeholder se não houver imagens válidas
  - Evita duplicação entre cover e galeria
- `MediaThumb` já possui `onError` para fallback automático em caso de falha de carregamento

#### G6: Hero — Headline, subheadline e CTAs para Dia das Mães
- Atualizada label para "Dia das Mães 2026"
- Nova headline: "Flores que **abraçam por você** neste Dia das Mães"
- Subheadline focada em entrega cuidadosa, mensagem personalizada e facilidade
- CTA primária: "Escolher presente agora" → `/catalogo`
- CTA secundária: "Ver sugestões especiais" → `/catalogo?destaque=dia-das-maes`
- Microanimações `hover:scale-[1.02]` nos botões

### Decisões técnicas

| Decisão | Justificativa |
|---|---|
| CSS global para cursor pointer em vez de classes individuais | Garante consistência em toda a aplicação sem precisar adicionar classe em cada botão/link |
| `OrderProgressBar` com 5 etapas fixas | Fluxo operacional da floricultura não varia; etapas hardcoded simplificam manutenção |
| Barra pulsante no step atual | Feedback visual claro do status em tempo real, alinhado com identidade acolhedora |
| Fetch de `cover_image_url` via `product_id` em orders | Melhora consistência visual entre catálogo e página de pedido |
| Filtro de imagens vazias no `ProductGallery` | Evita renderizar slots de thumbnail vazios ou com URLs inválidas |
| Redirecionamento direto pós-checkout | Melhora experiência pós-compra ao direcionar usuário para página de acompanhamento rica |

### O que mudou desde UX Polish Sprint 1

- Checkout agora redireciona para página pública em vez de `/pagamento`
- Página pública de pedido ganhou:
  - Mensagem de boas-vindas emocional
  - Barra de progresso visual com animações
  - Fotos dos itens do pedido
  - Layout otimizado para mobile e desktop
- Hero principal agora está alinhada com campanha de Dia das Mães
- Todas as áreas clicáveis têm cursor pointer via CSS global

### Arquivos criados

| Arquivo | Propósito |
|---|---|
| `features/orders/components/OrderProgressBar.tsx` | Barra de progresso horizontal com 5 etapas e animação pulsante |

### Arquivos modificados

| Arquivo | Mudanças |
|---|---|
| `app/globals.css` | CSS global para cursor pointer em elementos interativos |
| `features/checkout/components/CheckoutSubmitButton.tsx` | Nova copy, ícone HeartHandshake, microanimação |
| `features/checkout/components/CheckoutForm.tsx` | Alinhamento grid com `items-start`, redirecionamento para `/pedido/[code]` |
| `features/payments/data-order.ts` | Query estendida para buscar `product_id` e `cover_image_url`, tipo `OrderItemView` agora inclui `imageUrl` |
| `features/orders/components/OrderItemsList.tsx` | Exibe fotos dos produtos com MediaThumb, fallback visual |
| `features/orders/components/index.ts` | Exporta `OrderProgressBar` |
| `app/(public)/pedido/[codigo]/page.tsx` | Mensagem de boas-vindas, barra de progresso, layout otimizado |
| `lib/image-url.ts` | Tratamento para strings vazias/inválidas (`'null'`, `'undefined'`) |
| `features/catalog/components/ProductGallery.tsx` | Filtra imagens vazias, fallback robusto |
| `components/public/HomeHero.tsx` | Copy atualizada para Dia das Mães, novos CTAs, microanimações |

### Validação final

- ✅ TypeScript compila sem erros (`npx tsc --noEmit`)
- ✅ Linter não reporta problemas críticos nos arquivos alterados
- 🔄 Teste manual pendente:
  - Fluxo completo: home → catálogo → PDP → checkout → `/pedido/[code]`
  - Verificar barra de progresso com diferentes status de pedido
  - Confirmar carregamento de imagens em pedidos
  - Validar Hero com copy de Dia das Mães no mobile e desktop
  - Verificar cursor pointer em cards, botões, links
