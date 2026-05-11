# Architecture

## Objetivo
Construir um monorepo com dois apps independentes, compartilhando apenas fundação técnica e mantendo total separação operacional entre floricultura e home decor.

## Princípios
- velocidade de entrega com base sólida;
- reaproveitamento seguro, nunca cego;
- isolamento por empresa em produção;
- abstrações compartilhadas só quando houver benefício real imediato;
- MVP robusto antes de sofisticar domínio.

## Decisões finais de arquitetura
- Estrutura: `apps/floricultura-web`, `apps/home-decor-web`, `packages/ui`, `packages/core`, `packages/supabase`, `packages/payments`, `packages/notifications`, `packages/utils`, `supabase/floricultura`, `supabase/home-decor`, `docs`.
- `floricultura-web` terá catálogo público, PDP, carrinho, checkout, pedido, status e admin completo de MVP; `home-decor-web` herdará a fundação com checkout e admin simplificados.
- Compartilhado: componentes base, tokens, wrappers UI; schemas Zod e tipos de domínio; utilitários; integração Mercado Pago base; clientes/helpers Supabase; builders de notificação.
- Isolado por empresa: dados operacionais; projeto Supabase; buckets de storage; envs e segredos; deploy Vercel; webhooks e domínios.
- Racional: reduz retrabalho sem multi-tenant complexo; protege operação por marca; permite evoluções assimétricas; floricultura é o produto líder da fundação.

## Árvore final do monorepo

```txt
/apps
  /floricultura-web
    /app
      /(public)     # layout público; page em (public)/page.tsx → /
      /admin        # rotas /admin, /admin/login
      /api
    /components
      /public
      /admin
      /shared
    /features
      /catalog
      /cart
      /checkout
      /orders
      /admin
    /lib
    /public
    /styles
  /home-decor-web
    /app
      /(public)
      /(admin)
      /api
    /components
      /public
      /admin
      /shared
    /features
      /catalog
      /cart
      /checkout
      /orders
      /admin
    /lib
    /public
    /styles
/packages
  /ui
    /src/components
    /src/hooks
    /src/lib
  /core
    /src/catalog
    /src/orders
    /src/payments
    /src/admin
    /src/imports
    /src/schemas
    /src/constants
  /supabase
    /src/client
    /src/server
    /src/admin
    /src/storage
    /src/types
  /payments
    /src/mercado-pago
    /src/contracts
    /src/mappers
  /notifications
    /src/whatsapp
    /src/email
    /src/templates
  /utils
    /src/format
    /src/images
    /src/search
    /src/storage
/supabase
  /floricultura
    /migrations
    /seeds
    /functions
  /home-decor
    /migrations
    /seeds
    /functions
/docs
```

- **apps/\***: composição de rotas, features e UI específica de cada marca.
- **packages/\***: fundação compartilhada sem regras operacionais de uma única empresa.
- **supabase/\***: schema, migrations, seeds e funções separadas por app.

## Mapa de packages

| Package | Responsabilidade única | Entra | Não entra | Dependências | Risco |
|--------|------------------------|-------|-----------|--------------|-------|
| **ui** | Design system base e wrappers de interface | Primitives ShadCN, wrappers RHF, DataTable, PhoneInput, ImageSkeleton, EmptyState, useToast | Regra de negócio, Supabase, pagamentos | utils | Virar depósito de componentes de domínio |
| **core** | Contratos e regra de domínio compartilhável | Tipos, enums, schemas Zod, totalização, snapshots, contratos pedido/pagamento/importação | SDKs externos, queries Supabase, React | utils | Crescer demais; manter mappers externos separados |
| **supabase** | Acesso padronizado a Supabase | Clientes browser/server/service, auth, storage, tipos de banco, repositórios leves | Regra de pedido/pagamento, UI | core, utils | Misturar query com domínio |
| **payments** | Integração Mercado Pago e contratos de pagamento | createPixPayment, createCheckoutPreference, handleWebhook, syncPayment, mapProviderStatus, idempotência | Atualização final de pedido no banco sem camada definida | core, utils | Acoplamento ao schema; mitigar via contratos |
| **notifications** | Builders e envio opcional de notificações | Builders WhatsApp/e-mail, payloads de pedido, adaptadores de provider, mensagens admin-cliente | Decisão de quando notificar | core, utils | Incorporar regras de workflow |
| **utils** | Helpers puros transversais | Formatação, imagem, busca, slug, persistência local | React pesado, SDKs, regras críticas | nenhuma | Virar utilitário genérico sem fronteira |

- **db-types**, **checkout** e **importer** não são packages separados no MVP: tipos/contratos em `core`; importação em `core/imports`; fluxo de checkout compartilhado entre `core` e cada app.

## Responsabilidade dos apps

### apps/floricultura-web
- Catálogo público, PDP, carrinho, checkout (entrega/retirada), pedido, status, acompanhamento.
- Admin: CRUD categorias, produtos, banners, pedidos, taxas; edição manual de pedido; substituição de itens; aprovação; prazo estimado; importação XLSX.
- **Importação de produtos via XLSX**: template padrão v1 com suporte a múltiplas imagens via URLs; validação Zod por linha; criação automática de categorias; registro em `imports_log`.
- **Dashboard admin aprimorado**: cards visuais com ícones Lucide, navegação clara para pedidos, catálogo, importação, banners, planos e complementos.
- **Home admin operacional (`/admin`)**: métricas agregadas no servidor após `requireAdminSession`, usando o mesmo `createServerSupabaseClient()` do restante do painel (em produção, com `SUPABASE_SERVICE_ROLE_KEY`, bypass de RLS). KPIs alinhados ao conjunto de pedidos “abertos” da lista de pedidos; fila “precisa atenção” (`awaiting_approval`, `pending_payment`, `paid`); financeiro em 7 e 30 dias separando total Mercado Pago com `payment_status = paid` de “compromisso” (`pay_on_delivery` / `pay_on_pickup`, excl. rascunho/cancelado/expirado) e pedidos `completed` (por `completed_at`, com fallback `completed_at` nulo + `updated_at`); catálogo (produtos ativos/inativos) e último registro em `imports_log`. Implementação em `apps/floricultura-web/features/admin/dashboard/` (loader + componentes de seção).
- **Gestão de pedidos avançada**: filtros por status (em aberto, concluídos, cancelados); botões de ação rápida para WhatsApp (deep-link com mensagem pré-formatada); cópia de link público de acompanhamento.
- **Animações e feedback visual**: componente `AnimatedSection` com suporte a `prefers-reduced-motion`; aplicação em home, catálogo e admin; loadings evidentes em formulários e importações.
- **WhatsApp integrado**: deep-links `wa.me` com mensagens personalizadas para comunicação admin-cliente sobre pedidos; função `buildAdminOrderUpdateMessage` no pacote `notifications`.

### apps/home-decor-web
- Catálogo público, múltiplas imagens, checkout simples, carrinho, pedido básico.
- Admin básico: categorias, produtos, banners, pedidos; frete simples configurável.
- Estrutura preparada para evolução futura sem complexidades florais no primeiro deploy.

## Separação obrigatória por empresa
- 1 projeto Vercel por app.
- 1 projeto Supabase por app.
- Buckets de storage separados.
- Credenciais Mercado Pago separadas.
- Variáveis de ambiente separadas.
- Webhooks separados por domínio.
- Dados de catálogo, pedidos, clientes e pagamentos nunca compartilhados em runtime.

## Modelagem inicial consolidada

### Tabelas (comuns aos dois projetos)
- **admins**: id, auth_user_id, email, full_name, role, is_active, created_at, updated_at
- **settings**: id, store_name, brand_name, support_phone, support_email, pickup_enabled, delivery_enabled, currency_code, logo_url, theme_json, checkout_message, created_at, updated_at
- **banners**: id, title, subtitle, image_url, cta_label, cta_href, is_active, sort_order, created_at, updated_at
- **categories**: id, name, slug, description, image_url, is_active, sort_order, created_at, updated_at
- **products**: id, category_id, name, slug, short_description, description, price, compare_at_price, cover_image_url, is_active, is_featured, product_kind, metadata_json, created_at, updated_at
- **product_images**: id, product_id, image_url, alt_text, sort_order, created_at
- **customers**: id, full_name, phone, email, created_at, updated_at
- **addresses**: id, customer_id, label, recipient_name, phone, street, number, complement, neighborhood, city, state, postal_code, reference, created_at, updated_at
- **shipping_rules**: id, name, rule_type, amount, description, is_active, sort_order, metadata_json, created_at, updated_at
- **orders**: id, public_code, customer_id, status, payment_status, fulfillment_type, shipping_rule_id, shipping_amount, subtotal_amount, discount_amount, total_amount, payment_method, customer_note, gift_message, admin_note, estimated_fulfillment_text, address_snapshot_json, pricing_snapshot_json, created_at, updated_at, approved_at, cancelled_at, completed_at
- **order_items**: id, order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total, item_customization_json, created_at, updated_at
- **payments**: id, order_id, provider, provider_payment_id, provider_preference_id, status, amount, expires_at, paid_at, raw_payload_json, created_at, updated_at
- **imports_log**: id, file_name, import_type, status, total_rows, imported_rows, failed_rows, error_report_json, started_at, finished_at, created_at
- **order_status_history**: id, order_id, old_status, new_status, changed_by_type, changed_by_id, notes, created_at

### Relacionamentos
- categories 1:N products | products 1:N product_images | customers 1:N addresses | customers 1:N orders | orders 1:N order_items | orders 1:N payments | orders 1:N order_status_history | shipping_rules 1:N orders

### Enums
- product_kind: regular, customizable
- fulfillment_type: delivery, pickup
- payment_method: mercado_pago, pay_on_delivery, pay_on_pickup
- shipping_rule_type: fixed
- admin_role: owner, manager

### Regras de integridade
- orders.total_amount = subtotal_amount + shipping_amount - discount_amount
- gift_message permitido na floricultura; home-decor pode manter nulo no MVP
- address_snapshot_json obrigatório quando fulfillment_type = delivery
- shipping_rule_id obrigatório quando fulfillment_type = delivery
- public_code único por app

### Divergências futuras admitidas
- product_kind e metadata_json podem crescer na home decor (coleções/combos).
- shipping_rules pode ficar mais sofisticada na home decor.

## Status consolidados (pedido)
- draft | pending_payment | paid | awaiting_approval | approved | in_production | ready_for_pickup | out_for_delivery | completed | cancelled | expired

## Status consolidados (pagamento)
- pending | authorized | paid | expired | cancelled | failed | refunded_manual

## Ordem exata de implementação
1. Fundação do monorepo  
2. Configs compartilhadas  
3. Supabase base  
4. Auth admin  
5. Catálogo público da floricultura  
6. Carrinho  
7. Checkout  
8. Pagamento  
9. Admin  
10. Importação XLSX ✅  
11. UX aprimorada do admin (cards, ícones, animações) ✅  
12. Gestão avançada de pedidos (filtros, WhatsApp, links) ✅  
13. Hardening da floricultura  
14. Adaptação para home decor  
15. Deploy e validação final  

## Funcionalidades SaaS implementadas (floricultura-web)

### 1. Importação de produtos via planilha XLSX
- **Template padronizado**: `/public/templates/import-produtos-v1.xlsx` com colunas para categoria, produto, preços, imagens (capa + 3 extras via URLs) e flags (ativo, destaque).
- **Parser e validação**: módulo `packages/core/src/imports/products-xlsx.ts` com schemas Zod; parsing via biblioteca `xlsx`; normalização de booleanos e números; geração automática de slugs.
- **Server action**: `features/admin/product-import-actions.ts` com criação automática de categorias não existentes; inserção/atualização de produtos; criação de registros em `product_images`; log completo em `imports_log`.
- **UI no admin**: `/admin/produtos/import` com passo a passo (download template, upload, pré-visualização, importar, revisar); feedback visual de progresso e erros; resumo com contadores de sucesso/falha.

### 2. Dashboard admin aprimorado
- **Cards visuais**: página inicial (`/admin`) com grade responsiva de cards grandes com ícones Lucide (ShoppingBag, Package, FileSpreadsheet, Image, Stars, Gift, Globe2).
- **Navegação clara**: links diretos para Pedidos, Produtos, Importação, Banners, Planos, Complementos e Site Público.
- **Identidade visual SaaS**: design leve, editorial, sem aparência corporativa genérica; hover states e transições suaves.

### 3. Animações e feedback visual
- **Componente reutilizável**: `AnimatedSection` com Framer Motion; suporte a direções (up/down/left/right), delay e `prefers-reduced-motion`.
- **Aplicação**: home (hero, intro), catálogo, admin (cards), checkout (seções).
- **Loadings evidentes**: skeletons em carregamentos; botões com ícone `Loader2` girando; estados de carregamento claros em formulários, importações e ações de pedidos.

### 4. Gestão avançada de pedidos
- **Filtros por status**: componente client `AdminOrdersTableClient` com filtros "Em aberto" (pending_payment até out_for_delivery), "Concluídos", "Cancelados/Expirados" e "Todos"; contadores de pedidos por filtro.
- **Ações rápidas por pedido**:
  - Botão "Conversar no WhatsApp" (deep-link `wa.me` com mensagem formatada incluindo código do pedido, status e link de acompanhamento).
  - Botão "Copiar link" para URL pública de acompanhamento (`/pedido/{public_code}`).
- **Detalhe do pedido aprimorado**: seção de cliente com nome e telefone; botões de WhatsApp e cópia de link; badge destacado do status atual; formulário de atualização de status, prazo estimado e nota interna.
- **Resumo de itens**: coluna na lista com contagem de itens por pedido.

### 5. WhatsApp integrado (deep-links)
- **URL builder**: função `getWhatsAppUrl` em `packages/notifications` com normalização de telefone e encoding de mensagem.
- **Mensagens pré-formatadas**: templates para confirmação de pedido e atualização admin-cliente; estrutura com nome da loja, código do pedido, status, prazo estimado e link de tracking.
- **Uso no admin**: botões de ação rápida na lista e detalhe de pedidos; abertura em nova aba para manter contexto do admin.  

## Fora do MVP
- estoque avançado; cálculo complexo de frete; multi-tenant sofisticado; marketplace; fiscal/NF-e; automação de reembolso; motor genérico de combos complexos.
