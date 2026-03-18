# Flor do Estudante — Visão Geral do Projeto

## Objetivo
Construir uma base sólida para dois produtos digitais do mesmo cliente:

1. **Flor do Estudante Floricultura** — MVP de cardápio digital transacional com checkout, foco em reduzir atrito no WhatsApp e acelerar fechamento de pedidos.
2. **Flor do Estudante Home Decor** — MVP de catálogo transacional com base pronta para evoluir para e-commerce mais robusto.

## Decisão macro
A solução deverá ser construída como **um monorepo com dois apps independentes**, reaproveitando fundação técnica, UI, integrações e componentes comuns, mas mantendo **operações, dados e deploys separados por empresa**.

## Por que essa abordagem
- acelera entrega inicial;
- reduz duplicação de código;
- simplifica manutenção;
- evita acoplamento de catálogo, pedidos, pagamentos e operação entre negócios distintos;
- preserva liberdade para a Home Decor evoluir depois para um e-commerce mais completo sem contaminar a floricultura com complexidade desnecessária.

## Stack recomendada
- **Frontend:** Next.js (App Router)
- **UI:** ShadCN + Tailwind CSS
- **Backend operacional:** Supabase (Postgres, Auth para admin, Storage)
- **Hospedagem:** Vercel
- **Pagamentos:** Mercado Pago
- **Mensageria transacional:** WhatsApp e opcionalmente e-mail
- **Importação inicial de catálogo:** XLSX padronizado

## Apps previstos
- `apps/floricultura-web`
- `apps/home-decor-web`

## Packages compartilhados previstos
- `packages/ui`
- `packages/core`
- `packages/db-types`
- `packages/checkout`
- `packages/payments`
- `packages/notifications`
- `packages/importer`
- `packages/utils`

## Decisões já fechadas com o cliente

### Operação
- aprovação de pedido será manual no MVP;
- não haverá controle de estoque real inicialmente;
- taxas de entrega serão fixas e cadastradas pelo admin;
- prazo de entrega pode ser informado pelo admin na aprovação;
- pedido pode ter mensagem para cartão/presente;
- pedido pode ter observação;
- não haverá adicionais genéricos no MVP;
- itens podem ser substituídos manualmente durante aprovação.

### Pagamento
- pagamento integral;
- pagamento pode expirar se não for concluído;
- pedido pago sem aprovação permanece pendente até revisão da loja;
- reembolso será tratado manualmente fora da plataforma no MVP.

### Administração
- 1 admin por empresa no MVP;
- CRUD de banners, categorias, produtos e pedidos entra no MVP;
- importação XLSX do catálogo entra no MVP.

### Home Decor
- frete simples agora;
- sem cálculo por peso/volume;
- complexidade pontual permitida: montagem de cestas/combos personalizados a partir de opções restritas definidas pelo admin.

## Princípio de produto
O sistema **não deve competir com uma Nuvemshop no MVP**. Ele deve ser:
- rápido de lançar;
- simples de operar;
- coerente com a marca;
- suficiente para converter melhor leads do WhatsApp;
- escalável em camadas.
