# Direção de Marca, UI e UX

## Base pública analisada
A análise foi feita com base em referências públicas disponíveis no momento da pesquisa:
- Instagram da Home Decor;
- Instagram da Floricultura;
- loja pública da Home Decor em plataforma Nuvemshop;
- menções públicas e descrições de marca indexadas na web.

## Leitura de posicionamento

### Flor do Estudante Floricultura
A comunicação pública da floricultura orbita em torno de:
- presente afetivo;
- emoção;
- elegância;
- carinho;
- datas sazonais;
- arranjos, buquês, cestas e presentes.

O discurso da marca aponta mais para **delicadeza emocional** do que para compra puramente utilitária. A interface ideal precisa transmitir:
- confiança;
- suavidade;
- calor humano;
- sensação de presente especial.

### Flor do Estudante Home Decor
A Home Decor se apresenta com frases como:
- “Seu espaço com mais poesia e flores”;
- “Decoração, presentes e detalhes que encantam”.

Há um posicionamento mais editorial, contemplativo e aspiracional, aproximando decoração e sensibilidade estética. A interface ideal precisa comunicar:
- bom gosto;
- leveza;
- curadoria;
- atmosfera de casa bonita e acolhedora.

## Inferência de identidade visual
Sem acesso confiável a todos os assets internos da marca durante a pesquisa pública, a direção visual deve seguir estes eixos:

### Floricultura
- base clara;
- tons suaves, românticos e naturais;
- muito espaço em branco;
- fotografias grandes e emotivas;
- CTAs discretos, não agressivos;
- linguagem visual de boutique local premium.

### Home Decor
- visual mais editorial e sofisticado;
- composição limpa com destaque para fotos dos ambientes e objetos;
- sensação de catálogo curado;
- uso de tipografia com personalidade, porém sem comprometer performance nem legibilidade.

## Recomendação de paleta inicial
**Atenção:** a paleta abaixo é uma proposta de partida para o MVP. A paleta final deve ser refinada após extração dos tons reais do logo e das imagens oficiais do cliente.

### Floricultura — paleta sugerida
- `background`: `#FCF8F4`
- `foreground`: `#2E2A28`
- `primary`: `#8C5E6A`
- `primary-foreground`: `#FFFFFF`
- `secondary`: `#E9DCCF`
- `accent`: `#B88A44`
- `muted`: `#F3ECE5`
- `border`: `#E6D8CC`

### Home Decor — paleta sugerida
- `background`: `#FAF7F2`
- `foreground`: `#2D2A26`
- `primary`: `#7A6A58`
- `primary-foreground`: `#FFFFFF`
- `secondary`: `#DDD0C3`
- `accent`: `#B79E7B`
- `muted`: `#F1E9DF`
- `border`: `#E4D8CC`

## Direção tipográfica
### Base
- corpo: `Inter`
- apoio editorial/opcional para títulos: `Cormorant Garamond` ou `Playfair Display`

### Regra
- títulos hero e seções institucionais podem usar serif elegante;
- componentes de produto, preço, formulários e admin devem manter fonte sem serifa por legibilidade e velocidade.

## Direção de interface com ShadCN
ShadCN faz sentido aqui porque permite:
- velocidade de implementação;
- componentes consistentes;
- base acessível;
- facilidade de customização fina sem aparência genérica se o tema for bem ajustado.

## Componentes recomendados
- `Card` para produto e coleção;
- `Sheet` para carrinho lateral em mobile;
- `Dialog` para confirmação e edição pontual;
- `Tabs` para catálogo por categoria;
- `Accordion` para FAQ e detalhes;
- `Select` para taxa de entrega e regras administrativas;
- `Table` no admin;
- `Badge` para status de pedido;
- `Toast` para feedback rápido;
- `Form` com `react-hook-form` + `zod`.

## Direção visual por tela

### Home pública
- hero com imagem forte e proposta curta;
- blocos de categorias com fotografia;
- vitrine curta de produtos em destaque;
- prova social leve;
- CTA claro para comprar sem inflar página.

### Lista de produtos
- grade arejada;
- filtros simples;
- imagens com proporção consistente;
- destaque para nome, preço e botão de adicionar.

### Produto
- galeria limpa;
- descrição objetiva;
- observações úteis;
- CTA principal;
- no caso da floricultura, campo claro para mensagem de cartão mais adiante no checkout.

### Checkout
- poucas etapas;
- mínimo atrito;
- captura de dados essenciais;
- escolha entre retirada e entrega;
- seleção de taxa fixa cadastrada;
- observações do pedido;
- mensagem do cartão;
- escolha de pagamento.

### Admin
- layout funcional, sem excesso estético;
- foco em produtividade;
- navegação lateral simples;
- tabelas e formulários claros;
- upload de imagens e importação XLSX sem ambiguidade.

## Experiência que deve ser evitada
- visual genérico de template barato;
- excesso de banner rotativo;
- muitas etapas no checkout;
- efeitos pesados;
- filtros complexos cedo demais;
- múltiplas abstrações de e-commerce enterprise no MVP.

## Princípio de UX
**Catálogo bonito na frente, operação objetiva atrás.**
