# Checklist de deploy — Floricultura Web

**Documentos relacionados (sem duplicar tudo aqui):**

| Documento | Uso |
|-----------|-----|
| **`docs/handoff-operacao.md`** | Operação pós-go-live, URLs, contingência, variáveis. |
| **`docs/smoke-test-go-live.md`** | Validação pós-publicação com OK/NOK/observação. |
| **`docs/manual-steps.md`** | Detalhes MP webhook/sync (referência técnica). |

---

## Ordem única dos passos manuais (go-live)

1. **Supabase** (projeto prod) → link → `db push` → `db seed` → primeiro admin (Auth + `public.admins`).
2. **Vercel** → conectar repositório Git → **Root Directory** = `apps/floricultura-web` (o `vercel.json` nessa pasta instala/build a partir da **raiz do monorepo**).
3. Preencher **todas as envs** (tabela abaixo) em Production.
4. **Primeiro deploy** (ou aguardar deploy automático).
5. **Domínio** no DNS → Vercel; quando estiver ativo, setar **`NEXT_PUBLIC_SITE_URL`** = URL final `https://...` e fazer **novo deploy** (obrigatório para MP e links corretos no domínio próprio).
6. **Mercado Pago** → token + webhook `https://<DOMÍNIO>/api/webhooks/mercado-pago`.
7. Executar **`docs/smoke-test-go-live.md`**.

---

## 1. Supabase (produção)

- [ ] Projeto Supabase de produção criado (isolado do dev).
- [ ] `cd supabase/floricultura && supabase link --project-ref <REF_PROD> && supabase db push`
- [ ] Seeds: `supabase db seed` (ou fluxo acordado).
- [ ] Buckets e imagens de catálogo, se necessário.
- [ ] Primeiro admin: **Authentication** → usuário + `INSERT` em `public.admins` (SQL em `docs/manual-steps.md`).

---

## 2. Variáveis na Vercel (Production)

| Variável | Obrigatório | Notas |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Só servidor. |
| `NEXT_PUBLIC_SITE_URL` | **Sim após domínio próprio** | `https://loja.exemplo.com` sem barra final. Antes do domínio, na Vercel existe `VERCEL_URL`; após domínio custom, **deve** ser a URL pública final. |
| `MERCADO_PAGO_ACCESS_TOKEN` | Se MP online | Prod ou `TEST-` sandbox. |
| `PAYMENT_SYNC_SECRET` | Recomendado | Sem ela, `/api/payments/sync` → **503**. |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Opcional | MVP não exige. |

Preview: replicar envs se testar pagamento em branch.

---

## 3. Domínio e Vercel

- [ ] DNS apontando para o projeto (registros indicados pela Vercel).
- [ ] `NEXT_PUBLIC_SITE_URL` = URL que o **cliente** usa no navegador.
- [ ] SSL ativo (padrão Vercel).

---

## 4. Mercado Pago

- [ ] Token alinhado ao ambiente (sandbox vs produção).
- [ ] Webhook: `https://<DOMÍNIO_PUBLICO>/api/webhooks/mercado-pago` (POST; GET IPN suportado).
- [ ] Pagamento teste → logs Vercel (`[mercado-pago webhook]` se houver problema).

---

## 5. Build local (sanidade)

Na raiz do monorepo:

```bash
pnpm lint && pnpm typecheck && pnpm --filter floricultura-web build
```

*(Aviso de ESLint “Next.js plugin not detected” no build é conhecido e não impede produção.)*

---

## 6. Smoke test pós-deploy

Usar **`docs/smoke-test-go-live.md`** (tabelas OK/NOK).

**Sync manual** (se webhook atrasar):

```bash
curl -sS -X POST "https://<DOMÍNIO>/api/payments/sync" \
  -H "Authorization: Bearer <PAYMENT_SYNC_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"publicCode":"FD-2026-XXXXXXXX"}'
```

---

## 7. Handoff

- [ ] Credenciais no cofre do cliente.
- [ ] Responsável por reembolso manual no MP definido.
- [ ] Equipe leu **`docs/handoff-operacao.md`**.

---

## Monitoramento (primeiros dias)

- Logs Vercel: 5xx em checkout e webhook.
- MP: notificações com falha.
- Pedidos **aguardando aprovação** após pagamento.
