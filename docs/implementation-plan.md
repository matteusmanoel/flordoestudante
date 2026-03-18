# Implementation Plan

Plano de execução detalhado para a FASE 3 (EXECUTE). Cada milestone tem objetivo, entregáveis, dependências, risco principal e definição de pronto.

---

## 1. Fundação do monorepo
- **Objetivo:** workspace pnpm, raiz do monorepo, convenções e scripts base.
- **Entregáveis:** `package.json` raiz, `pnpm-workspace.yaml`, estrutura de pastas `apps/`, `packages/`, `supabase/`, `docs/`, scripts de install/build/lint.
- **Dependências:** aprovação do plano.
- **Risco:** escolher abstrações cedo demais.
- **Pronto:** estrutura raiz criada e clara; `pnpm install` executa sem erro.

---

## 2. Configs compartilhadas
- **Objetivo:** TypeScript, lint, Tailwind, ShadCN base, convenções de env.
- **Entregáveis:** `tsconfig` base e extends por app/package; ESLint e Prettier; Tailwind config; ShadCN inicial (components.json e primeiros componentes); `.env.example` e documentação de variáveis.
- **Dependências:** milestone 1.
- **Risco:** divergência entre apps.
- **Pronto:** apps conseguem herdar configuração comum; lint e build de raiz funcionam.

---

## 3. Supabase base
- **Objetivo:** schema inicial e seeds por app; projetos Supabase referenciados por env.
- **Entregáveis:** `supabase/floricultura` e `supabase/home-decor` com migrations (admins, settings, banners, categories, products, product_images, customers, addresses, shipping_rules, orders, order_items, payments, order_status_history, imports_log); seeds mínimas; documentação de run local (Supabase CLI).
- **Dependências:** 1 e 2.
- **Risco:** schema incompleto.
- **Pronto:** banco inicial sobe com migrações consistentes em cada projeto.

---

## 4. Auth admin
- **Objetivo:** Supabase Auth, tabela `admins`, guardas de área privada e bootstrap do primeiro admin.
- **Entregáveis:** fluxo de login (email/senha ou magic link conforme decisão); tabela `admins` ligada a `auth.users`; middleware ou guard que valida sessão e perfil em `admins`; seed ou script para criar primeiro admin na floricultura.
- **Dependências:** 3.
- **Risco:** fronteira entre auth e perfil administrativo.
- **Pronto:** login admin funcional na floricultura; rotas `/admin` protegidas.

---

## 5. Catálogo público da floricultura
- **Objetivo:** home pública, categorias, listagem, PDP, banners.
- **Entregáveis:** rotas públicas (home, categorias, produto por slug); listagem de produtos com filtro por categoria; página de detalhe do produto (imagens, descrição, preço, CTA); exibição de banners; uso de packages (ui, core, supabase, utils) onde aplicável.
- **Dependências:** 2, 3.
- **Risco:** sobrecarga visual antes do fluxo fechar.
- **Pronto:** navegação pública coerente e performática; dados vindos do Supabase da floricultura.

---

## 6. Carrinho
- **Objetivo:** store persistida, resumo e edição de itens.
- **Entregáveis:** store de carrinho (context ou store persistido em localStorage); estrutura de item com snapshot necessário para pedido (product_id, name, price, quantity, etc.); UI de resumo e edição de quantidades; integração com catálogo (adicionar ao carrinho).
- **Dependências:** 5.
- **Risco:** snapshots incompletos do item.
- **Pronto:** carrinho estável com persistência local; dados prontos para enviar no checkout.

---

## 7. Checkout
- **Objetivo:** formulário, entrega/retirada, endereço, observação, mensagem de cartão, criação de pedido.
- **Entregáveis:** formulário de checkout (RHF + Zod): cliente (nome, telefone, email), tipo de entrega (delivery/pickup), endereço quando delivery, observação, mensagem de cartão (floricultura); seleção de taxa de entrega; criação de pedido no Supabase (orders + order_items + customer/address se necessário); redirecionamento para pagamento ou página de confirmação.
- **Dependências:** 6 e 3.
- **Risco:** ambiguidade em campos obrigatórios.
- **Pronto:** pedido criado com consistência; status inicial correto (ex.: draft ou pending_payment); total e itens conferidos.

---

## 8. Pagamento
- **Objetivo:** Mercado Pago (PIX e/ou checkout preference), pagar na entrega/retirada, webhook, sync manual, reconciliação básica.
- **Entregáveis:** criação de pagamento/preference via API route; opção “pagar na entrega/retirada” (pedido vai para awaiting_approval); webhook Mercado Pago que atualiza payment e order; endpoint de sync manual para status de pagamento; idempotência e external_reference com order_id/public_code; mapeamento de status do provedor para status interno.
- **Dependências:** 7.
- **Risco:** inconsistência entre status interno e provedor.
- **Pronto:** pedidos passam corretamente para awaiting_approval ou expired; webhook e sync testados.

---

## 9. Admin
- **Objetivo:** CRUDs, pedidos, edição manual, substituição de itens, aprovação e prazo estimado.
- **Entregáveis:** CRUD categorias, produtos (com upload de imagens), banners; CRUD de regras de entrega (taxa fixa); listagem e detalhe de pedidos; edição manual de pedido (observações, itens, substituição de item); aprovação e cancelamento; campo e fluxo de prazo estimado; atualização de status (in_production, ready_for_pickup, out_for_delivery, completed); uso de order_status_history quando aplicável.
- **Dependências:** 4, 5, 7, 8.
- **Risco:** excesso de escopo em telas administrativas.
- **Pronto:** operação diária possível sem suporte técnico (floricultura).

---

## 10. Importação XLSX
- **Objetivo:** parser, validação, relatório de erro, importação de catálogo.
- **Entregáveis:** upload de arquivo XLSX; parser com colunas esperadas (categoria, produto, preço, imagens, etc.); validação por linha com Zod/schemas; inserção em lote em categories/products/product_images; registro em imports_log (file_name, status, total_rows, imported_rows, failed_rows, error_report_json); UI de resultado (sucesso/erros por linha).
- **Dependências:** 9 e 3.
- **Risco:** planilha malformada.
- **Pronto:** admin importa catálogo padronizado com feedback claro de erros.

---

## 11. Hardening da floricultura
- **Objetivo:** revisão UX, empty states, erros, logs, smoke tests e ajustes de fluxo.
- **Entregáveis:** tratamento de estados vazios (carrinho, lista de pedidos, catálogo); mensagens de erro amigáveis; logs adequados em webhook e sync; smoke test manual ou automatizado (catálogo → carrinho → checkout → pagamento → admin); ajustes de copy e fluxo conforme feedback.
- **Dependências:** 1 a 10.
- **Risco:** regressões tardias.
- **Pronto:** primeira versão pronta para deploy controlado da floricultura.

---

## 12. Adaptação para home decor
- **Objetivo:** branding, catálogo, checkout simples e admin básico derivados da fundação.
- **Entregáveis:** app home-decor-web com identidade visual própria; catálogo com categorias e múltiplas imagens; carrinho e checkout simplificados (sem mensagem de cartão no MVP); frete simples configurável; admin básico (categorias, produtos, banners, pedidos); reuso de packages e padrões da floricultura sem trazer complexidade desnecessária.
- **Dependências:** 11.
- **Risco:** levar complexidade floral desnecessária.
- **Pronto:** home decor funciona de ponta a ponta sem acoplamento indevido ao fluxo floral.

---

## 13. Deploy e validação final
- **Objetivo:** projetos Vercel, envs, webhooks, buckets, smoke test e checklist operacional.
- **Entregáveis:** deploy de floricultura-web e home-decor-web na Vercel; variáveis configuradas por app e ambiente; webhooks Mercado Pago apontando para URLs corretas; buckets e políticas Supabase revisadas; checklist de produção preenchido (domínio, envs, buckets, webhook, admin inicial, smoke test).
- **Dependências:** 11 e 12.
- **Risco:** configuração externa incompleta.
- **Pronto:** ambos os apps implantáveis com isolamento correto; documentação de deploy e manual-steps atualizada.

---

## Backlog priorizado

- **P0 — obrigatório para o primeiro deploy:** fundação do monorepo; configs compartilhadas; schema inicial e seeds; auth admin; catálogo público da floricultura; carrinho; checkout; pagamentos; admin floricultura; importação XLSX; hardening floricultura mínimo.
- **P1 — importante após MVP:** automações de notificação mais ricas; melhorias visuais finas; relatórios operacionais simples; filtros de admin mais avançados; melhorias de reconciliação de pagamento.
- **P2 — evolução futura:** combos/cestas mais sofisticados; frete mais inteligente; múltiplos papéis de admin; cupons/descontos complexos; estoque e fiscal; reembolso assistido pelo sistema.

---

## Corte de escopo (MVP)

- Não incluir: estoque avançado; múltiplos admins com permissões granulares; cupons complexos; reembolso automatizado; cálculo de frete por CEP/peso; fiscal/NF-e; customização rica de combos na home decor no primeiro deploy.
- Floricultura: mensagem de cartão e aprovação manual entram; home decor: mensagem de cartão opcional ou fora do primeiro deploy conforme decisão de produto.
