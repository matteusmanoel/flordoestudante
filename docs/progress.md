# Progress

## Status atual
- Fase ativa: **EXECUTE** (FASE 3)
- Milestone: **ETAPA 13 concluída** — go-live assistido: handoff operacional (`docs/handoff-operacao.md`), smoke test executável (`docs/smoke-test-go-live.md`), checklist/deploy consolidados, aviso em log se produção sem URL pública configurada.
- Estado: `floricultura-web` pronta para **publicação assistida**; sem lacunas internas documentadas; ações externas seguem `docs/deploy-checklist.md`.
- Apps: floricultura (fluxo completo MVP); `home-decor-web` mínimo.

## O que foi feito
- **ETAPA 1:** scaffold do monorepo (workspace pnpm, configs, árvore, apps e packages placeholder).
- **ETAPA 2 — Fundação compartilhada:**
  - **packages/utils:** string (slugify, truncate, capitalize, normalizeSpaces, isBlank, orDefault), currency (formatCurrency, formatNumber, parseCurrency, roundCurrency), date (formatDate, formatDateTime, parseISODate, isValidDate), phone (digitsOnly, normalizePhoneBR, formatPhoneBR, toE164BR, isValidPhoneBR), cn (clsx + tailwind-merge), format (padStart, mask, pluralize), object (get, uniqueBy, groupBy), storage (getLocalItem, setLocalItem, removeLocalItem, STORAGE_KEYS), search (normalizeForSearch, searchMatches); exports centralizados; zero dependências de domínio/app.
  - **packages/core:** constantes (ORDER_STATUS, PAYMENT_STATUS, PRODUCT_KIND, FULFILLMENT_TYPE, PAYMENT_METHOD, SHIPPING_RULE_TYPE, ADMIN_ROLE, PAYMENT_PROVIDER, IMPORT_STATUS e labels); tipos (Category, Product, ProductImage, Banner, Customer, Address, AddressSnapshot, Order, OrderItem, OrderItemSnapshot, ShippingRule, Payment, Settings, ImportLog, ImportErrorRow); schemas Zod (checkout: checkoutContactSchema, addressSchema, checkoutFormSchema; catalog: categorySchema, productSchema, bannerSchema, shippingRuleSchema); normalizers (calculateSubtotal, calculateTotal, calculateLineTotal); dependência apenas de `@flordoestudante/utils` e zod.
  - **packages/ui:** design system base com Radix + CVA; componentes Button, Input, Textarea, Label, Card, Badge, Skeleton, Separator, Dialog, Sheet, DropdownMenu, Select, Checkbox, RadioGroup, Tabs, EmptyState, Section, PageHeader, Price, StatusBadge; lib/utils (cn re-export de utils); dependência de `@flordoestudante/utils`; tema via classes Tailwind (primary, muted, etc.) a serem definidas no app.
  - **packages/supabase:** createSupabaseBrowserClient (url + anonKey), createSupabaseServerClient (url + anonKey + serviceRoleKey opcional); tipos SupabaseError e isSupabaseError; estrutura client/server/types; sem schema completo nem queries de domínio.
  - **packages/payments:** contratos (CreatePaymentInput, PaymentPreferenceResult, CreatePixPaymentInput, PixPaymentResult, WebhookPayload, SyncPaymentResult, MapToInternalStatusInput/Result); mappers (mapProviderStatusToInternal); serviço base Mercado Pago (MercadoPagoService, validateWebhookSignature, parseWebhookPayload, mapToInternalStatus); dependências core e utils.
  - **packages/notifications:** tipos (NotificationChannel, EmailPayload, WhatsAppPayload, OrderNotificationPayload); contratos (EmailSender, WhatsAppSender, NotificationConfig); templates (buildOrderConfirmationSubject, buildOrderConfirmationText, buildWhatsAppOrderMessage); whatsapp (getWhatsAppUrl, buildWhatsAppPayload); email (buildEmailPayload); dependências core e utils.
  - Validação: nenhuma dependência circular; utils sem deps; core só utils; ui só utils; supabase sem core no código atual; payments e notifications com core/utils. Lint e typecheck e build verdes.
- **ETAPA 3 — Base de infraestrutura Supabase da floricultura:**
  - **Migrations:** `00001_enums.sql` (order_status, payment_status, fulfillment_type, payment_method, product_kind, shipping_rule_type, admin_role, payment_provider, import_status, changed_by_type); `00002_core_tables.sql` (settings, admins, categories, products, product_images, banners, shipping_rules, customers, addresses); `00003_orders_and_payments.sql` (orders, order_items, payments, order_status_history, imports_log); `00004_triggers.sql` (update_updated_at em tabelas com updated_at); `00005_rls.sql` (RLS ativado, current_user_is_admin(), políticas de leitura pública para catálogo/settings/shipping_rules e admins_select_own); `00006_storage_buckets.sql` (product-images, banner-images, brand-assets).
  - **Seeds:** `01_settings_and_catalog.sql` (settings, categorias, produtos, product_images, banners, shipping_rules); `02_dev_customer_and_order.sql` (cliente e pedido de exemplo).
  - **Auth admin:** tabela `admins` com FK para `auth.users`; estratégia documentada em `docs/manual-steps.md` (criar usuário no Auth, inserir em `admins`); helper `getAdminByAuthUserId` em `packages/supabase`.
  - **Storage:** buckets criados via migration; convenção de caminhos e políticas de upload documentadas para etapa posterior.
  - **Integração:** `packages/supabase` com tipos mínimos `FloriculturaAdminRow`/`FloriculturaDatabase` e export de `getAdminByAuthUserId`; `supabase/floricultura/config.toml` e README com comandos; docs atualizados (progress, setup, manual-steps).
  - Validação: lint, typecheck e build executados com sucesso.
- **ETAPA 4 — Bootstrap do app floricultura-web:**
  - **Config:** `package.json` com tailwindcss, postcss, autoprefixer; `tailwind.config.ts` com content (app, components, features, packages/ui), cores (CSS vars), radius, fontFamily (Source Sans 3, Crimson Pro); `postcss.config.mjs`; `app/globals.css` com tema (--primary verde suave, --muted, etc.).
  - **Layouts e rotas:** layout raiz com fontes e metadata; `app/(public)/layout.tsx` (PublicHeader + main + PublicFooter) e `app/(public)/page.tsx` (home); `app/admin/layout.tsx` (AdminShell), `app/admin/page.tsx` (placeholder), `app/admin/login/page.tsx` (login placeholder); `app/api/health/route.ts`.
  - **Componentes públicos:** PublicHeader, PublicFooter, HomeHero, HomeIntro, HomeHighlights (hero, intro, área destaque/CTA).
  - **Componentes admin:** AdminShell (nav lateral/superior, sem shell na login), AdminLoginForm (card placeholder).
  - **Integração Supabase:** `lib/env.ts` (env.supabaseUrl, supabaseAnonKey, siteUrl, getSupabaseConfig); `lib/supabase/client.ts` (getSupabaseClient para browser), `lib/supabase/server.ts` (createServerSupabaseClient); `.env.example` com NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
  - **Features:** pastas e barrels em features/catalog, cart, checkout, orders, admin, shared (placeholders).
  - **Lib:** `lib/constants.ts` (APP_NAME, ROUTES).
  - Validação: lint, typecheck e build verdes.
- **ETAPA 5 — Catálogo público da floricultura:**
  - **Camada de dados:** `features/catalog/data.ts` — getCategories, getBanners, getFeaturedProducts, getProducts (com filtro por categoria), getProductBySlug; getClientOrNull() para não quebrar sem .env; tipagem com ProductRow/CategoryRow/BannerRow e view models (CategoryCard, ProductCardModel, ProductDetailViewModel, BannerViewModel).
  - **Mapeamento:** `features/catalog/mappers.ts` — mapCategoryToCard, mapProductToCard, mapProductToDetail, mapBannerToViewModel; normalização de categories (objeto ou array) e campos opcionais.
  - **Componentes:** ProductCard, ProductGrid, CategoryChip, CatalogEmptyState, CatalogSection, ProductGallery, ProductSummary, ProductCardSkeleton; uso de packages/ui (Price, Button, Card, EmptyState, Skeleton).
  - **Rotas:** home com dados reais (HomeCatalogSection, HomeBanners), `/catalogo` (listagem + filtro por categoria), `/produto/[slug]` (PDP com galeria e resumo); `app/not-found.tsx` para 404.
  - **Metadata:** title/description na home (layout), catálogo e PDP (generateMetadata por slug).
  - **Estados:** sem categorias/produtos → empty state; slug inexistente → notFound(); Supabase não configurado → arrays vazios e mensagem “Em breve”.
  - **Imagens:** Next/Image com placeholder data URL e remotePatterns para *.supabase.co; unoptimized para URLs externas.
  - Validação: lint, typecheck e build verdes.
- **ETAPA 6 — Carrinho da floricultura:**
  - **Modelo:** `features/cart/types.ts` — CartItem (productId, slug, name, categoryName, imageUrl, unitPrice, quantity, lineTotal), Cart, CartCheckoutPayload; alinhado a OrderItemSnapshot do core.
  - **Store:** `features/cart/store.tsx` — CartProvider + useCart(); estado em React (useState), persistência em localStorage (chave `flor_cart`); hidratação com flag `hydrated` para evitar flash de contagem; addItem, removeItem, setQuantity, increment/decrementQuantity, clear; toastMessage após adicionar (2,5s).
  - **Helpers:** getSubtotal, getTotalItemCount, findItemByProductId, sanitizeQuantity (1–99), createCartItem, updateItemQuantity, mergeItemIntoCart; checkout-payload: cartToCheckoutPayload(items).
  - **Componentes:** CartSheet (trigger + drawer lateral com lista, summary, CTA), CartItemRow (imagem, nome, controles de quantidade, remover), CartSummary (subtotal, aviso de frete no checkout), CartEmptyState, CartToast.
  - **Layout:** CartProvider no (public) layout; PublicHeader com CartSheet e CartToast; link Catálogo no header e footer; link Carrinho no footer.
  - **PDP:** ProductSummary com seletor de quantidade e botão “Adicionar ao carrinho” que chama addItem; toast com nome do produto.
  - **Listagem:** ProductCard permanece focado em descoberta (clique leva à PDP); adição ao carrinho apenas na PDP para manter composição visual limpa.
  - **Rota dedicada:** `/carrinho` com lista de itens, edição de quantidade, resumo e CTA para checkout.
  - Validação: lint, typecheck e build verdes.
- **ETAPA 7 — Checkout da floricultura:**
  - **Modelo:** `features/checkout/types.ts` — CheckoutFormValues (core), ShippingRuleOption, AddressSnapshotPayload, CreateOrderInput, CreateOrderResult/Error; schema reutilizado de `packages/core` (checkoutFormSchema).
  - **Dados:** `features/checkout/data.ts` — getActiveShippingRule() (primeira regra ativa por sort_order); fallback quando não há regra.
  - **Persistência:** `features/checkout/actions.ts` (server action) — createOrder: valida carrinho e pré-condições; find-or-create customer (por email/phone); insert address quando entrega; geração de public_code (FD-YYYY-XXXXXXXX); insert order (status draft, payment_status pending) e order_items; uso de createServerSupabaseClient (service role quando SUPABASE_SERVICE_ROLE_KEY definida).
  - **Formulário:** React Hook Form + zodResolver(checkoutFormSchema); CheckoutContactSection, CheckoutFulfillmentSection (entrega/retirada + forma de pagamento), CheckoutAddressSection (condicional), CheckoutNotesSection; shipping_rule_id definido no client quando fulfillment = delivery; default fulfillment = pickup quando não há regra ativa.
  - **Resumo e totais:** CheckoutSummary com itens, subtotal, entrega (ou R$ 0 para retirada), total; total = subtotal + shipping - discount (discount = 0 no MVP).
  - **Rotas:** `/checkout` (página com CheckoutPageClient: empty state ou CheckoutForm); `/checkout/sucesso?codigo=FD-...` (CheckoutSuccess com código do pedido).
  - **Pré-condições e erros:** carrinho vazio → CheckoutEmptyState; submit com erro (validação, shipping rule, persistência) → mensagem em estado submitError; limpeza do carrinho apenas após sucesso real da criação.
  - **Navegação:** CartSheet e página /carrinho com CTA “Finalizar pedido” / “Ir para o checkout” → /checkout.
  - **Status iniciais (ETAPA 7, evoluído na 8):** ver ETAPA 8.
  - Validação: lint, typecheck e build verdes.
- **ETAPA 8 — Pagamento da floricultura:**
  - **Estratégia:** Mercado Pago via Checkout Pro (preference); offline = `pay_on_delivery` (só entrega) / `pay_on_pickup` (só retirada); registro em `payments` para todo pedido.
  - **MP:** após pedido + itens → insert `payments` (provider `mercado_pago`, `expires_at` +24h) → POST preference (API MP) → `provider_preference_id` + `raw_payload_json.mp_init_point`; order `pending_payment` + `payment_status` pending. Falha na preference: pedido mantido, link regenerável em `/pedido/[codigo]/pagamento`.
  - **Offline:** order `awaiting_approval`; `payments` provider `manual`, amount = total, pending até confirmação na operação.
  - **Pós-checkout:** redirect único para `/pedido/[publicCode]/pagamento` (UX por método: CTA MP, instruções offline, pago, expirado).
  - **Webhook:** `POST|GET /api/webhooks/mercado-pago` → `processMercadoPagoPaymentById` → GET payment MP → `applyMercadoPagoStatusToOrder` (mapper `@flordoestudante/payments`): **paid** → order `awaiting_approval` + payment paid + `paid_at`; **expired** → order `expired`; failed/cancelled → atualiza payment, order segue recuperável.
  - **Expiração:** lazy em `expireMercadoPagoPaymentIfNeeded` ao carregar página de pagamento (sem scheduler).
  - **Reconciliação:** `POST /api/payments/sync` com `Authorization: Bearer PAYMENT_SYNC_SECRET` e body `{ "publicCode" }` ou `{ "providerPaymentId" }`.
  - **Retry MP:** server action `retryMercadoPagoPreference` (nova preference após falha ou status failed/cancelled).
  - **Validação checkout:** core `checkoutFormSchema` — pay_on_delivery só com entrega; pay_on_pickup só com retirada; UI filtra opções por fulfillment.
  - Validação: lint, typecheck e build verdes.

## Decisões práticas (ETAPA 8)
- **Webhook:** corpo JSON `data.id` ou IPN `topic=payment&id=`; idempotência via skip se payment já `paid`.
- **Expiração:** 24h em `payments.expires_at`; leitura na página de pagamento marca expired se passou.
- **Sync manual:** `PAYMENT_SYNC_SECRET`; sem secret, rota sync retorna 503.
- **URL pública:** `getPublicSiteUrl()` — `NEXT_PUBLIC_SITE_URL` → `https://VERCEL_URL` → localhost.

## ETAPA 12 — Deploy controlado (floricultura-web)
- **`lib/site-url.ts`:** URL base única para MP (back_urls, notification_url) e coerência com deploy Vercel.
- **`vercel.json` (app):** install/build a partir da raiz do monorepo (`pnpm --filter floricultura-web build`); Root Directory na Vercel = `apps/floricultura-web`.
- **Webhook MP:** try/catch + `console.warn`/`console.error` com prefixo `[mercado-pago webhook]`; JSON inclui `processed: boolean`.
- **Sync:** 503 se `PAYMENT_SYNC_SECRET` ausente; 401 se Bearer inválido.
- **Docs:** `docs/deploy-checklist.md` (deploy + smoke test 14 passos + handoff); `docs/setup.md` e `docs/manual-steps.md` alinhados às envs reais; `.env.example` enxuto.
- **Pronto para produção:** build estável, imagens Supabase em `remotePatterns`, sem localhost hardcoded no fluxo MP (fallback só dev).
- **Limitações MVP:** importação XLSX não no escopo desta etapa; estoque/aprovação manual; reembolso manual no MP.
- **Monitorar:** logs Vercel (webhook), pedidos `awaiting_approval` pós-pagamento, falhas de notificação MP.

## ETAPA 13 — Go-live assistido
- **`docs/handoff-operacao.md`:** URLs, envs obrigatórias, ordem de publicação, MVP limits, contingência (MP, webhook, admin, imagens).
- **`docs/smoke-test-go-live.md`:** blocos A–F (público, checkout, pagamento, acompanhamento, admin, fechamento) com OK/NOK/observação.
- **`docs/deploy-checklist.md`:** ordem única de passos manuais, links cruzados, `NEXT_PUBLIC_SITE_URL` obrigatório após domínio próprio + redploy.
- **`docs/manual-steps.md`:** reduzido a resumo; detalhe no checklist/handoff.
- **Código:** `getPublicSiteUrl` — `console.warn` em produção se cair em fallback localhost (sem `NEXT_PUBLIC_SITE_URL` nem `VERCEL_URL`).

## Decisões práticas (ETAPA 2)
- **utils:** incluídos `clsx` e `tailwind-merge` para `cn`; funções puras e sem dependência de React/Next/Supabase/MP.
- **core:** schemas de checkout com campos de contato inline no checkoutFormSchema (evitar spread de ZodEffects.shape); normalizers usam roundCurrency de utils.
- **ui:** componentes baseados em Radix UI e CVA; Sheet implementado com o mesmo primitive do Dialog (Radix Dialog); Price usa formatCurrency de utils; StatusBadge aceita variantMap customizável; apps devem incluir `packages/ui` no content do Tailwind e definir variáveis CSS (--primary, --muted, etc.) ou tema.
- **supabase:** clientes recebem url e key por parâmetro (app injeta env); não foi adicionado @supabase/ssr para manter o package agnóstico; app Next pode usar @supabase/ssr por conta própria.
- **payments:** implementação HTTP/SDK do Mercado Pago fica no app; package expõe contratos, mappers e placeholder de validação de webhook.
- **notifications:** envio real (Resend, WhatsApp API) fica no app; package expõe tipos, contratos e builders de payload/mensagem.

## Decisões práticas (ETAPA 3)
- Schema Supabase-first: enums no banco alinhados a `packages/core` (order_status, payment_status, etc.); tabelas com FKs, checks (ex.: orders.total_amount = subtotal + shipping - discount) e índices essenciais.
- Auth admin: 1 admin por empresa no MVP; vínculo `admins.auth_user_id` → `auth.users(id)`; primeiro admin criado manualmente (Auth + INSERT em admins); RLS com leitura pública para catálogo e `admins_select_own` para authenticated.
- Storage: buckets criados em migration; políticas de upload deixadas para o app (service role) ou configuração posterior.
- Tipos: `FloriculturaAdminRow` e helper `getAdminByAuthUserId` em packages/supabase; tipos completos podem ser gerados com `supabase gen types typescript` quando o projeto estiver linkado.

## Bloqueios
- Nenhum bloqueio de código para deploy; dependências externas: infra e credenciais (checklist em `docs/deploy-checklist.md`).

## Decisões práticas (ETAPA 4)
- Rotas admin em `app/admin/` (segment real) para evitar conflito com `(public)/page` no path `/`; route group `(public)` apenas para layout compartilhado.
- Tema: primary verde (150 35% 32%), fundos claros, Crimson Pro para títulos (editorial), Source Sans 3 para corpo.
- Supabase: cliente browser só instanciado quando necessário (getSupabaseClient); server client em lib/supabase/server para API/layouts.

## Decisões práticas (ETAPA 5)
- Tipo de lista: ProductCardModel (evitar conflito de nome com componente ProductCard).
- Catálogo: filtro por categoria via query `?categoria=slug`; chip “Todos” com total; empty state quando não há produtos.
- PDP: CTA “Adicionar ao carrinho (em breve)” preparado para ETAPA 6; galeria com capa + imagens extras ordenadas por sort_order.

## Decisões práticas (ETAPA 6)
- **Store:** Context + useState + localStorage (sem Zustand); chave `flor_cart`; hidratação com `hydrated` para não exibir badge até ter valor real e evitar flash.
- **Listagem:** Sem botão “Adicionar” no ProductCard; card focado em descoberta (clique → PDP); adição ao carrinho só na PDP para manter identidade visual e evitar poluição no grid.
- **Rota /carrinho:** Implementada para revisão e preparação do checkout; sheet no header para acesso rápido; página completa para listar e editar itens antes do próximo passo.

## Decisões práticas (ETAPA 7)
- **Checkout:** server action (createOrder) em vez de API route para manter fluxo simples e evitar duplicar validação; cliente Supabase com service role obrigatório para inserts (customers, addresses, orders, order_items).
- **Shipping:** uma única regra ativa (primeira por sort_order); retirada = shipping 0; entrega sem regra ativa → default fulfillment pickup e mensagem de erro em caso de submit com delivery sem regra.
- **Pós-sucesso:** redirecionamento para `/checkout/sucesso?codigo=FD-...`; carrinho limpo somente após resposta success da action; rota de sucesso preparada para ETAPA 8 (ex.: link futuro para pagamento ou acompanhamento).
- **Cliente:** find by email ou phone; se existir, update nome/phone/email; senão insert; endereço sempre insert quando entrega (snapshot no order + linha em addresses).

## Próximos passos
- Executar go-live seguindo `docs/deploy-checklist.md` e validar com `docs/smoke-test-go-live.md`.
- Operação: `docs/handoff-operacao.md`.
- Evolução: home-decor, importação XLSX, notificações reais.
