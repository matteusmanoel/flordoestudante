# Plano de Execução

## Ordem recomendada

### Fase 0 — Auditoria e reaproveitamento
- auditar projetos-base existentes;
- mapear componentes reaproveitáveis;
- decidir o que copiar, adaptar ou descartar;
- registrar isso em `/docs/progress.md`.

### Fase 1 — Fundação do monorepo
- criar workspace;
- configurar TypeScript, ESLint, Prettier, Tailwind;
- configurar ShadCN base;
- criar packages compartilhados;
- definir tokens de tema e componentes base.

### Fase 2 — Banco e backend base
- definir schema inicial;
- criar migrações;
- criar seed mínima;
- configurar clientes Supabase;
- preparar autenticação do admin.

### Fase 3 — MVP Floricultura
- home pública;
- listagem de categorias/produtos;
- produto;
- carrinho;
- checkout;
- criação de pedido;
- Mercado Pago;
- acompanhamento de pedido;
- painel admin;
- banners/categorias/produtos/pedidos/taxas;
- importação XLSX.

### Fase 4 — Hardening da Floricultura
- revisar UX;
- revisar textos;
- validar estados vazios e erros;
- revisar webhooks;
- revisar logs.

### Fase 5 — Home Decor
- duplicar estrutura útil da floricultura;
- adaptar branding;
- habilitar catálogo específico;
- simplificar o que não se aplica;
- adicionar base do combo/cesta personalizada, se couber no cronograma.

### Fase 6 — Deploy e documentação final
- preparar Vercel por app;
- preparar variáveis;
- validar webhooks públicos;
- registrar checklist final.

## Priorização real de entrega
### Primeiro a ficar pronto
- fundação + floricultura

### Segundo a ficar pronto
- home decor usando a mesma base

## Critério de sucesso do MVP
- admin consegue cadastrar/importar produtos;
- cliente consegue montar carrinho e pedir;
- cliente consegue pagar;
- loja recebe pedido;
- admin consegue revisar e atualizar status;
- cliente consegue acompanhar pedido.

## Riscos de cronograma
- tentar fazer multi-tenant completo;
- inventar estoque avançado cedo;
- supergeneralizar combos/cestas;
- polir demais visual antes do fluxo operacional ficar pronto;
- reescrever integração já existente em vez de reaproveitar.
