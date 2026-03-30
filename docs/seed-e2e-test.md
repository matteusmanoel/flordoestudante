# Seed e credenciais para teste E2E (Floricultura)

## Objetivo

Permitir testar a aplicação **end-to-end** (catálogo, carrinho, checkout, painel admin) com dados de teste e um usuário admin fixo.

---

## Credenciais de teste (admin)

| Campo | Valor |
|-------|--------|
| **E-mail** | `admin@flordoestudante.com.br` |
| **Senha** | `Admin123!` |
| **Uso** | Login em `/admin/login` |

O usuário é criado no **Supabase Auth** e vinculado à tabela `public.admins` (role `owner`, ativo). Se o script de seed já foi executado com sucesso, use essas credenciais para acessar o painel.

---

## Como rodar o seed

**Na raiz do monorepo:**

```bash
pnpm seed:floricultura
```

**Requisitos:**

- `apps/floricultura-web/.env` ou `.env.local` com:
  - `NEXT_PUBLIC_SUPABASE_URL` — URL do projeto Supabase
  - `SUPABASE_SERVICE_ROLE_KEY` — chave service role (cria usuário no Auth)
- **Opcional:** `DATABASE_URL` — connection string do Postgres (ex.: `postgresql://postgres:SENHA@db.REF.supabase.co:5432/postgres`).  
  Se definido, o script aplica também o seed SQL (settings, categorias, produtos, banners, frete, cliente e pedido de exemplo). A senha deve ser a **senha do banco** (Supabase Dashboard → Settings → Database), não o project ref.

**Se as migrations ainda não foram aplicadas no projeto:**

- Aplicar antes as migrations (Supabase Dashboard → SQL Editor com os arquivos em `supabase/floricultura/supabase/migrations/`, ou `cd supabase/floricultura && supabase link --project-ref <REF> && supabase db push`).
- O script só insere em `admins` e executa o seed SQL se as tabelas já existirem.

---

## Dados de teste inseridos pelo seed SQL

- **Settings:** loja Flor do Estudante, contato, retirada e entrega habilitados.
- **Categorias:** Buquês, Presentes.
- **Produtos:** Buquê Rosas Vermelhas, Buquê Misto, Cesta Café da Manhã, Vaso Orquídea.
- **Banners:** 2 banners placeholder.
- **Frete:** regra “Entrega padrão” R$ 15,00.
- **Cliente:** Cliente Teste, teste@exemplo.com, telefone exemplo.
- **Pedido:** FD-2024-0001 (draft), 1 item, entrega, endereço exemplo.

---

## Checklist rápido E2E (levantamento de ajustes)

Após o seed e com o app rodando (`pnpm dev` em `apps/floricultura-web`):

1. **Público**
   - [ ] Home carrega; banners e produtos em destaque.
   - [ ] `/catalogo` lista categorias e produtos.
   - [ ] PDP (produto) abre; adicionar ao carrinho.
   - [ ] Carrinho atualiza; ir para checkout.
   - [ ] Checkout: retirada ou entrega; preenchimento de dados; observação e mensagem para cartão.
   - [ ] Finalizar (pagamento offline ou MP sandbox); ver código do pedido (ex.: FD-…).
   - [ ] Página do pedido `/pedido/[codigo]` exibe status e detalhes.

2. **Admin**
   - [ ] `/admin/login` com **admin@flordoestudante.com.br** / **Admin123!**.
   - [ ] Redirecionamento para `/admin` após login.
   - [ ] Lista de pedidos; abrir pedido de exemplo FD-2024-0001.
   - [ ] Alterar status, prazo, nota; substituir/ajustar itens.
   - [ ] Reflexo na página pública do pedido (ex.: prazo estimado).
   - [ ] Sair.

3. **Bordas**
   - [ ] Carrinho vazio não permite ir ao checkout (ou redirecionamento adequado).
   - [ ] Pedido inexistente retorna 404 ou mensagem clara.
   - [ ] Env Supabase ausente: mensagem de erro compreensível.

Anote os pontos que falharem ou precisarem de melhoria para implementação posterior.
