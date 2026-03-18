# Requisitos Funcionais Consolidados

## Escopo do MVP — Floricultura

### Catálogo público
- listar categorias;
- listar produtos;
- exibir nome, descrição, imagens e preço;
- permitir busca simples opcional;
- exibir banners gerenciáveis pelo admin.

### Carrinho e checkout
- adicionar/remover itens;
- alterar quantidade;
- capturar telefone e/ou e-mail, com pelo menos um obrigatório;
- permitir observação do pedido;
- permitir mensagem opcional para cartão/presente;
- permitir retirada ou entrega;
- quando entrega: selecionar taxa fixa cadastrada;
- criar pedido;
- permitir pagamento integral via Mercado Pago;
- permitir opção pagar na entrega/retirada.

### Pós-pedido
- pedido entra como pendente;
- admin aprova manualmente;
- admin pode substituir itens durante aprovação;
- admin pode informar prazo estimado;
- cliente pode acompanhar status do pedido em página pública dedicada;
- sistema pode notificar loja e cliente.

## Escopo do MVP — Home Decor
- catálogo público com categorias;
- produto com múltiplas imagens;
- carrinho;
- checkout simplificado;
- frete simples com taxa fixa;
- pagamento integral;
- admin básico;
- base para futura expansão.

## Complexidade adicional permitida
### Cestas/combos personalizados
A Home Decor pode ter uma funcionalidade controlada de composição de cesta/kit:
- admin cadastra opções permitidas;
- cliente monta a combinação dentro das regras;
- sem motor complexo de variações genéricas no MVP.

## Fora do MVP
- estoque em tempo real;
- múltiplos usuários admin;
- cupons sofisticados;
- regras promocionais avançadas;
- cálculo de frete por peso/volume;
- integração ERP;
- área do cliente;
- recuperação de carrinho;
- split de pagamento;
- reembolso automatizado;
- marketplace;
- recomendação inteligente.

## Requisitos administrativos
- login do admin;
- CRUD de categorias;
- CRUD de produtos;
- CRUD de banners;
- CRUD de pedidos;
- cadastro de taxas de entrega;
- importação XLSX de catálogo;
- upload de imagens;
- edição manual de pedido;
- mudança de status.

## Requisitos não funcionais
- mobile first;
- performance boa em rede comum;
- UX simples para usuários não técnicos;
- operação administrativa direta;
- logs básicos de eventos críticos;
- build reproduzível.
