# Manual Steps

Ações **fora do repositório**. A ordem completa do go-live está em **`docs/deploy-checklist.md`**. Operação e contingência: **`docs/handoff-operacao.md`**.

---

## Resumo por sistema

### Supabase (floricultura)
1. Criar projeto (produção).
2. `cd supabase/floricultura` → `supabase link --project-ref <REF>` → `supabase db push` → `supabase db seed`.
3. **Primeiro admin:** Dashboard → Authentication → criar usuário → copiar UUID → SQL:
   ```sql
   INSERT INTO public.admins (auth_user_id, email, full_name, role, is_active)
   VALUES ('<UUID>', 'admin@...', 'Nome', 'owner', true);
   ```

### Vercel
- Importar o **mesmo repositório** do monorepo.
- **Root Directory:** `apps/floricultura-web`.
- Envs: ver `apps/floricultura-web/.env.example` e tabela em `docs/deploy-checklist.md`.

### Domínio / DNS
- Apontar domínio para o projeto Vercel.
- Atualizar **`NEXT_PUBLIC_SITE_URL`** para `https://<domínio>` e **redploy**.

### Mercado Pago
- **Token:** `MERCADO_PAGO_ACCESS_TOKEN` na Vercel (produção ou `TEST-` sandbox).
- **Webhook:** `https://<DOMÍNIO_PUBLICO>/api/webhooks/mercado-pago`
- Corpo POST ou IPN GET (`topic=payment&id=...`). Logs: `[mercado-pago webhook]` na Vercel.
- Requer `SUPABASE_SERVICE_ROLE_KEY` no servidor.

### Sync manual
`POST /api/payments/sync` com header `Authorization: Bearer <PAYMENT_SYNC_SECRET>` e JSON `{"publicCode":"FD-..."}` ou `{"providerPaymentId":"..."}`. Sem secret configurado → **503**.

---

## Pós-deploy

Validação: **`docs/smoke-test-go-live.md`**.

---

## Home decor

Quando existir infra dedicada: outro Supabase, outro projeto Vercel, outras envs (isolado da floricultura).
