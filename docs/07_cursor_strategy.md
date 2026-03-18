# Estratégia para CursorIDE

## Princípio
Não usar um único prompt gigante pedindo tudo de uma vez. O ideal é conduzir o Cursor em três camadas:

1. **AUDIT**
2. **PLAN**
3. **EXECUTE**

## Como o Cursor deve trabalhar
- primeiro entender o estado atual do repositório;
- depois propor plano;
- só depois implementar;
- sempre atualizar `/docs/progress.md`;
- sempre preferir reaproveitamento a reescrita.

## Prompt de auditoria
```md
Atue como Arquiteto de Soluções e Engenheiro Full Stack Sênior.

Contexto:
Precisamos construir dois produtos para a marca Flor do Estudante:
1. Floricultura
2. Home Decor

Objetivo:
Auditar o repositório atual e os projetos-base já existentes para identificar o que pode ser reutilizado na construção de um monorepo com dois apps independentes.

Stack-alvo:
- Next.js
- Supabase
- Vercel
- ShadCN
- Mercado Pago

Tarefas:
1. mapear componentes, hooks, serviços e fluxos reutilizáveis;
2. identificar trechos do projeto cvenew úteis para Mercado Pago e checkout;
3. identificar trechos do projeto portfolio-ticket-loko úteis para catálogo, layout e experiência;
4. propor o que copiar, adaptar e descartar;
5. sugerir a estrutura inicial do monorepo.

Restrições:
- não implementar ainda;
- não reinventar o que já existe;
- priorizar velocidade e clareza.

Formato da resposta:
- diagnóstico
- itens reutilizáveis
- itens a refatorar
- itens a descartar
- estrutura proposta
- checklist para modo PLAN
```

## Prompt de plano
```md
Agora entre em modo PLAN.

Com base na auditoria, gere um plano de implementação completo para um monorepo com:
- apps/floricultura-web
- apps/home-decor-web
- packages compartilhados

Diretrizes obrigatórias:
- deploy separado por app;
- Supabase separado por empresa;
- credenciais separadas;
- foco em MVP;
- sem overengineering;
- ShadCN como base de UI;
- Home Decor preparada para crescer depois.

O plano deve incluir:
1. árvore de diretórios;
2. packages e responsabilidades;
3. modelagem inicial;
4. fluxos públicos;
5. fluxos administrativos;
6. integração Mercado Pago;
7. integração WhatsApp/e-mail;
8. importação XLSX;
9. backlog por milestones;
10. critérios de aceite.

Não gerar código ainda.
```

## Prompt de execução
```md
Agora execute o plano aprovado.

Regras:
1. implemente por etapas;
2. mantenha o projeto buildável;
3. atualize /docs/progress.md a cada etapa;
4. reaproveite o máximo possível dos projetos-base;
5. documente o que não puder ser automatizado.

Entregáveis mínimos:
- fundação do monorepo
- app da floricultura funcional
- base da home decor
- painel admin
- catálogo público
- carrinho
- checkout
- integração Mercado Pago
- documentação

Restrições:
- nada de multi-tenant complexo;
- nada de estoque avançado agora;
- nada de abstrações exageradas;
- não acoplar os bancos das duas empresas.
```

## Instrução operacional importante
Sempre que o Cursor tomar decisão estrutural relevante, ele deve registrar:
- contexto;
- decisão;
- trade-offs;
- impacto.

Isso evita deriva arquitetural durante o vibecoding.
