# Critérios de Aceite

## Fundação
- monorepo sobe localmente com comando único;
- apps compilam sem erro;
- packages compartilhados são consumidos corretamente;
- tema visual é customizável por marca.

## Catálogo público
- categorias renderizam;
- produtos renderizam;
- imagens carregam;
- página de produto funciona;
- UX mobile está aceitável.

## Carrinho
- adiciona item;
- remove item;
- altera quantidade;
- persiste durante a sessão.

## Checkout
- exige pelo menos telefone ou e-mail;
- permite retirada ou entrega;
- aplica taxa fixa cadastrada;
- aceita observação;
- aceita mensagem de cartão/presente;
- cria pedido consistente.

## Pagamento
- cria preferência/pagamento no Mercado Pago;
- salva identificadores do gateway;
- webhook atualiza status;
- pagamento expirado muda de estado corretamente.

## Admin
- login funciona;
- CRUD de categorias funciona;
- CRUD de produtos funciona;
- CRUD de banners funciona;
- CRUD de taxas de entrega funciona;
- listagem e edição de pedidos funciona;
- troca manual de itens funciona;
- aprovação manual funciona;
- prazo estimado pode ser informado.

## Importação XLSX
- admin consegue importar planilha padrão;
- linhas válidas entram;
- linhas inválidas geram feedback;
- erros são compreensíveis.

## Pós-venda
- cliente acessa página pública do pedido;
- status renderiza corretamente;
- histórico essencial fica compreensível.

## Qualidade
- build de produção passa;
- lint e typecheck passam;
- README de setup existe;
- `.env.example` existe;
- documentação mínima existe.
