# Arquitetura Recomendada

## Estratégia
Adotar **monorepo com apps independentes e infraestrutura segregada por negócio**.

## Estrutura sugerida
```txt
/apps
  /floricultura-web
  /home-decor-web
/packages
  /ui
  /core
  /db-types
  /checkout
  /payments
  /notifications
  /importer
  /utils
/docs
```

## Separação obrigatória por empresa
Cada negócio deve ter:
- projeto Vercel próprio;
- projeto Supabase próprio;
- Storage próprio;
- credenciais próprias de Mercado Pago;
- webhooks próprios;
- domínio/subdomínio próprio;
- dados operacionais próprios.

## O que compartilhar
- design system e tema base;
- componentes reutilizáveis;
- helpers e utilitários;
- fluxo base de checkout;
- integração base com Mercado Pago;
- notificações;
- importador XLSX;
- schemas Zod;
- tipos TypeScript.

## O que não compartilhar em runtime
- tabelas de catálogo;
- pedidos;
- clientes;
- pagamentos;
- zonas/taxas de entrega;
- arquivos operacionais;
- banners;
- credenciais.

## Razão da arquitetura
Mesmo cliente, mas operações diferentes:
- marca diferente;
- catálogo diferente;
- maturidade diferente;
- potencial de evolução diferente;
- risco de suporte e operação se tudo ficar no mesmo banco.

## Modelo de deploy
### Floricultura
- objetivo: entrar em produção primeiro;
- prioridade: velocidade, simplicidade e estabilidade.

### Home Decor
- objetivo: nascer em cima da mesma fundação, com visual próprio e base de evolução futura.

## Estratégia de ambientes
Para cada app:
- `development`
- `preview`
- `production`

## Estratégia de branches
- `main`
- `develop`
- feature branches curtas

## Política de implementação
1. fundação compartilhada;
2. MVP da floricultura completo;
3. adaptação da Home Decor;
4. endurecimento operacional;
5. backlog fase 2.

## Riscos arquiteturais evitados por esta abordagem
- banco acoplado cedo demais;
- overengineering multi-tenant no MVP;
- dependência cruzada de deploy;
- regressões entre marcas;
- crescimento assimétrico mal acomodado.
