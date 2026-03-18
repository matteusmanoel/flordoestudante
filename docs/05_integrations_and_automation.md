# Integrações e Automações

## Mercado Pago

### Estratégia
Reaproveitar o que já existir do projeto `cvenew`, isolando em pacote compartilhado quando viável.

### Fluxo recomendado
1. cliente fecha carrinho;
2. sistema cria pedido com status inicial;
3. se método for Mercado Pago, cria preferência/pagamento;
4. sistema grava `provider_preference_id`;
5. cliente paga;
6. webhook confirma status;
7. pedido vai para `paid_pending_review`;
8. admin revisa e aprova manualmente;
9. sistema atualiza cliente com novo status.

### Regras
- pagamento expira se não concluído;
- expiração atualiza pedido para `expired`;
- reembolso não será automatizado no MVP;
- sempre registrar payload bruto do gateway para auditoria básica.

## WhatsApp

### Objetivo no MVP
- avisar a loja sobre novo pedido;
- opcionalmente avisar cliente sobre criação, aprovação e conclusão;
- manter canal principal de operação sem exigir CRM complexo no MVP.

### Recomendações
- implementar uma camada `notifications` desacoplada;
- suportar pelo menos templates simples por status;
- armazenar log básico de envio/sucesso/erro.

## E-mail
Opcional no MVP, mas útil como fallback:
- confirmação de pedido;
- atualização de status;
- contato da loja.

## Importação XLSX

### Objetivo
Permitir carga inicial rápida do catálogo pelo admin.

### Arquivo padrão sugerido
Colunas mínimas:
- categoria
- nome
- slug opcional
- descrição curta
- descrição longa
- preço
- ativo
- destaque
- imagem_principal_url
- imagens_adicionais_urls
- tipo_produto

### Regras
- validar cabeçalho;
- validar preço numérico;
- validar categorias inexistentes com opção de criar automaticamente;
- gerar relatório de erro por linha;
- suportar modo dry-run futuro, mas pode ficar fora do MVP se atrasar.

## CLI e automação de setup
Sempre que possível automatizar:
- bootstrap do monorepo;
- instalação de dependências;
- scaffold dos apps;
- configuração base do ShadCN;
- geração de `.env.example`;
- scripts de lint, build e seed;
- migrações SQL;
- criação de buckets/policies via scripts documentados.

## Automação mínima obrigatória
- script `pnpm dev` no workspace;
- script `pnpm build`;
- script de validação de tipos;
- script de seed por app;
- script ou documentação clara para configurar Supabase e Vercel.
