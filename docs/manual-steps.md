# Manual Steps

Passos externos (Supabase, Vercel, Mercado Pago, DNS) que não são automatizados no repositório.

## 1. Infra por app
- Projeto **Supabase** dedicado à floricultura (dev + prod separados se possível).
- Projeto **Vercel** dedicado à floricultura (`apps/floricultura-web` como root directory).
- **Mercado Pago:** aplicação/credenciais da loja (sandbox e produção).

## 2. Supabase — Floricultura
Ver `docs/setup.md`. Resumo:
- Link + `db push` + `db seed`.
- Criar usuário em **Authentication** e inserir em `public.admins`:
  ```sql
  INSERT INTO public.admins (auth_user_id, email, full_name, role, is_active)
  VALUES ('<UUID auth.users>', 'admin@...', 'Nome', 'owner', true);
  ```

## 3. Vercel — envs de produção
Configurar todas as variáveis listadas em `apps/floricultura-web/.env.example` para o ambiente **Production** (e Preview se for testar MP em branch).

**Crítico:** `NEXT_PUBLIC_SITE_URL` = URL final com **https** (ex.: `https://www.lojaflor.com.br`), alinhada ao domínio onde o cliente compra. Isso alimenta:
- `notification_url` e `back_urls` enviados ao Mercado Pago na criação da preference.

## 4. Domínio
- Apontar DNS para o projeto Vercel.
- Após propagar, confirmar que `NEXT_PUBLIC_SITE_URL` coincide com o domínio público.

## 5. Mercado Pago — webhook e notificações

### URL a cadastrar no painel MP
```
https://<SEU_DOMÍNIO_PUBLICO>/api/webhooks/mercado-pago
```
Substitua pelo mesmo host de `NEXT_PUBLIC_SITE_URL` (sem path extra).

### Comportamento
- **POST:** corpo JSON com `topic`/`resource` ou `data.id` (pagamento). O servidor extrai o ID, busca o pagamento na API MP e atualiza pedido no Supabase.
- **GET (IPN):** `?topic=payment&id=<id>` — mesmo processamento.
- Respostas **200** mesmo em falha parcial (evita loop agressivo do MP); falhas relevantes aparecem nos **logs da Vercel** (`[mercado-pago webhook]`).

### Requisitos
- `MERCADO_PAGO_ACCESS_TOKEN` válido para o mesmo ambiente (sandbox vs prod) do pagamento.
- `SUPABASE_SERVICE_ROLE_KEY` na Vercel (webhook roda no servidor).

`MERCADO_PAGO_WEBHOOK_SECRET` no código está preparado para uso futuro; o MVP não exige configurá-lo no painel para o fluxo básico.

## 6. Reconciliação manual (`/api/payments/sync`)
Útil quando o webhook atrasou ou falhou.

1. Definir `PAYMENT_SYNC_SECRET` na Vercel (string longa aleatória).
2. Chamada:
   ```bash
   curl -X POST "https://<DOMÍNIO>/api/payments/sync" \
     -H "Authorization: Bearer <PAYMENT_SYNC_SECRET>" \
     -H "Content-Type: application/json" \
     -d '{"publicCode":"FD-2026-..."}'
   ```
   ou `"providerPaymentId":"<id MP>"`.

Se `PAYMENT_SYNC_SECRET` não estiver definido, a API responde **503** com mensagem explícita.

## 7. Pós-deploy
Seguir **smoke test** em `docs/deploy-checklist.md` (seção 6).

## 8. Home decor
Quando a infra existir, repetir padrão isolado (outro Supabase, outro Vercel, outras envs).
