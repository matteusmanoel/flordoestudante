# Checklist de deploy — Floricultura Web

Use este documento no **primeiro deploy controlado** e em releases subsequentes. Projeto Vercel deve ter **Root Directory** = `apps/floricultura-web` (o `vercel.json` do app já aponta install/build para a raiz do monorepo).

---

## 1. Supabase (produção)

- [ ] Projeto Supabase de produção criado (isolado do dev).
- [ ] `cd supabase/floricultura && supabase link --project-ref <REF_PROD> && supabase db push`
- [ ] Seeds iniciais: `supabase db seed` (ou fluxo acordado para dados mínimos).
- [ ] Buckets de storage criados (via migrations) e imagens de catálogo/banners carregadas se necessário.
- [ ] Primeiro admin: usuário em **Authentication** + `INSERT` em `public.admins` (ver `docs/manual-steps.md`).

---

## 2. Variáveis na Vercel (Production)

| Variável | Obrigatório | Notas |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase prod. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anon. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Apenas servidor; nunca expor no client. |
| `NEXT_PUBLIC_SITE_URL` | **Recomendado forte** | URL canônica **com https**, sem barra final (ex.: `https://loja.exemplo.com`). Usada em preference MP (back_urls, notification_url). Se omitida na Vercel, o app usa `https://<VERCEL_URL>` (útil em preview; em domínio próprio, configure sempre). |
| `MERCADO_PAGO_ACCESS_TOKEN` | Se MP online | Produção ou `TEST-` para sandbox. |
| `PAYMENT_SYNC_SECRET` | Recomendado | String forte; usada em `POST /api/payments/sync`. Sem ela, a rota retorna 503. |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Opcional | Reservado para validação avançada de assinatura (não obrigatório no MVP atual). |

Replicar o conjunto coerente em **Preview** se houver testes de pagamento em branch deploy.

---

## 3. Domínio

- [ ] Domínio apontado para o projeto Vercel (DNS conforme wizard da Vercel).
- [ ] `NEXT_PUBLIC_SITE_URL` = URL final que o cliente vê (domínio próprio).
- [ ] SSL ativo (padrão Vercel).

---

## 4. Mercado Pago (produção)

- [ ] Conta/credenciais de **produção** (ou sandbox para homologação).
- [ ] **URL de notificação (webhook):** `https://<SEU_DOMÍNIO>/api/webhooks/mercado-pago`  
  - MP envia **POST** com payload de pagamento; a rota também aceita **GET** com `topic=payment&id=<payment_id>` (IPN legado).
- [ ] Garantir que o token MP da Vercel corresponde ao ambiente (sandbox vs produção) do painel onde o webhook foi cadastrado.
- [ ] Após deploy, fazer um pagamento de teste e confirmar nos logs da Vercel linhas `[mercado-pago webhook]` (sucesso silencioso; aviso se `processed: false`).

---

## 5. Build local de sanidade (antes ou após configurar envs)

Na raiz do monorepo:

```bash
pnpm lint && pnpm typecheck && pnpm --filter floricultura-web build
```

---

## 6. Smoke test pós-deploy (operação)

Executar na **URL de produção** (domínio final):

1. [ ] **Home** — carrega sem erro.
2. [ ] **Catálogo** — lista categorias/produtos.
3. [ ] **PDP** — abrir um produto; imagens e preço ok.
4. [ ] **Carrinho** — adicionar item na PDP; badge/header coerente.
5. [ ] **Checkout retirada** — finalizar com “pagar na retirada”; receber código `FD-...`.
6. [ ] **Checkout entrega** — endereço válido + entrega; finalizar offline se MP não estiver em teste.
7. [ ] **Pedido offline** — em `/pedido/[codigo]`, status e totais coerentes.
8. [ ] **Pedido online (MP)** — com token configurado, fluxo até MP e retorno; pedido pago refletido (webhook ou sync manual).
9. [ ] **Página pública** `/pedido/[codigo]` — acessível sem login; dados do pedido corretos.
10. [ ] **Login admin** — `/admin/login` com usuário em `admins`.
11. [ ] **Dashboard admin** — home admin carrega.
12. [ ] **Pedidos** — listagem mostra pedidos recentes.
13. [ ] **Detalhe do pedido** — abrir pedido; alterar status (ex.: aprovado).
14. [ ] **Reflexo público** — recarregar `/pedido/[codigo]` e conferir status atualizado.

**Sync manual (se webhook atrasar):**

```bash
curl -sS -X POST "https://<DOMÍNIO>/api/payments/sync" \
  -H "Authorization: Bearer <PAYMENT_SYNC_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"publicCode":"FD-2026-XXXXXXXX"}'
```

---

## 7. Handoff operacional

- [ ] Credenciais Supabase/Vercel/MP guardadas no cofre do cliente.
- [ ] Documentado quem aciona reembolso manual no MP (MVP).
- [ ] Limitações MVP conhecidas: sem importação XLSX em prod até configurada; estoque manual; um admin principal.

---

## Monitoramento no primeiro uso real

- Logs Vercel: erros 5xx em checkout e webhooks.
- Mercado Pago: notificações com falha ou reenvio.
- Pedidos em `awaiting_approval` após pagamento: fluxo operacional de aprovação manual.
