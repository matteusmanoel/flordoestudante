# Manual Steps

Ações **fora do repositório**. **Desenvolvimento local + seeds:** `docs/setup.md` e **`docs/runbook-mvp-tests.md`**. Go-live: **`docs/deploy-checklist.md`**. Operação: **`docs/handoff-operacao.md`**.

---

## Resumo por sistema

### Supabase (floricultura)
1. Criar projeto (produção).
2. Na raiz: `pnpm db:floricultura:sync` → `cd supabase/floricultura` → `supabase link` → `supabase db push`.
3. **Produção:** sem seed demo; dados reais no Studio ou SQL. **Local:** `pnpm db:supabase:reset` após `supabase start`.
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

### Teste no celular (imagens / Storage)

- Se `NEXT_PUBLIC_SUPABASE_URL` apontar para **`127.0.0.1`**, **`localhost`** ou um hostname só da sua máquina, o **navegador do telefone** não consegue baixar arquivos do Storage → miniaturas quebradas no catálogo/checkout/admin.
- **Recomendado para demo em device:** usar projeto **Supabase na nuvem** em dev ou staging.
- Alternativa avançada: expor o Supabase local via túnel (ngrok, Cloudflare Tunnel) e usar essa URL em `NEXT_PUBLIC_SUPABASE_URL` no `.env` do app.
- As URLs de mídia no banco no formato `bucket/caminho/arquivo` passam a ser resolvidas com a base atual do ambiente; trocar de projeto Supabase não exige reescrever cada registro, desde que o arquivo exista no Storage do novo projeto.

---

## Pós-deploy

Validação: **`docs/smoke-test-go-live.md`**.

---

## Home decor

Quando existir infra dedicada: outro Supabase, outro projeto Vercel, outras envs (isolado da floricultura).
