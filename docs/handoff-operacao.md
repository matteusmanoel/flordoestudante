# Handoff — operação Floricultura Web (produção)

Documento curto para **quem opera a loja** após o go-live. Detalhes técnicos de deploy: `docs/deploy-checklist.md`.

---

## 1. Visão rápida

- Site Next.js na **Vercel**, dados na **Supabase**, pagamento online **Mercado Pago** (Checkout Pro).
- Pedidos offline (retirada/entrega) não passam pelo MP.
- Após pagamento MP, pedido fica **aguardando aprovação** até alguém aprovar no admin.

---

## 2. URLs principais

Substitua `https://SEU-DOMINIO` pela URL real (a mesma de `NEXT_PUBLIC_SITE_URL`).

| Uso | Caminho |
|-----|---------|
| Home | `https://SEU-DOMINIO/` |
| Catálogo | `https://SEU-DOMINIO/catalogo` |
| Checkout | `https://SEU-DOMINIO/checkout` |
| Pedido público (cliente) | `https://SEU-DOMINIO/pedido/FD-...` |
| Pagamento do pedido | `https://SEU-DOMINIO/pedido/FD-.../pagamento` |
| Admin (login) | `https://SEU-DOMINIO/admin/login` |
| Admin (painel) | `https://SEU-DOMINIO/admin` |
| Webhook MP (só configuração MP) | `https://SEU-DOMINIO/api/webhooks/mercado-pago` |
| Sync manual (API, com secret) | `POST https://SEU-DOMINIO/api/payments/sync` |

---

## 3. Variáveis obrigatórias (Vercel)

| Variável | Motivo |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Site e login admin |
| `SUPABASE_SERVICE_ROLE_KEY` | Checkout, webhook, ações servidor |
| `NEXT_PUBLIC_SITE_URL` | **Domínio final com https** — MP e links corretos |
| `MERCADO_PAGO_ACCESS_TOKEN` | Se vender com pagamento online |
| `PAYMENT_SYNC_SECRET` | Para forçar atualização de pagamento via API |

Lista completa: `apps/floricultura-web/.env.example`.

---

## 4. Passos manuais de publicação (ordem)

1. **Supabase:** projeto prod → `supabase link` → `db push` → `db seed` → criar usuário Auth + linha em `public.admins`.
2. **Vercel:** importar repo → **Root Directory** = `apps/floricultura-web` → envs de produção.
3. **Deploy** automático após push (ou Deploy manual).
4. **DNS:** domínio → Vercel; depois **redefinir** `NEXT_PUBLIC_SITE_URL` para o domínio final e **redploy**.
5. **Mercado Pago:** token de produção (ou teste) + URL de notificação = webhook acima.

---

## 5. Smoke test resumido

Checklist executável com colunas OK/NOK: **`docs/smoke-test-go-live.md`**.

---

## 6. Problemas conhecidos do MVP

- Sem importação XLSX automatizada nesta fase.
- Estoque não é descontado automaticamente.
- Um admin principal por loja (fluxo manual para mais usuários).
- Reembolso só manual no painel Mercado Pago.
- Expiração de link MP ~24h (cliente pode gerar novo link na página de pagamento, se aplicável).

---

## 7. Contingência

| Situação | Ação |
|----------|------|
| **MP não abre / preference falha** | Conferir token na Vercel; modo sandbox vs produção; logs Vercel no momento do checkout. Oferecer **pagar na retirada/entrega** ao cliente. |
| **Webhook não atualiza pedido** | Logs Vercel `[mercado-pago webhook]`; conferir URL no painel MP = domínio final. **Sync:** `POST /api/payments/sync` com Bearer `PAYMENT_SYNC_SECRET` e `{"publicCode":"FD-..."}`. |
| **Pedido pago mas status estranho** | Sync manual; no admin, conferir status e histórico. |
| **Admin não loga** | Usuário existe em Supabase Auth? Linha em `public.admins` com mesmo `auth_user_id` e `is_active = true`? |
| **Imagens quebradas** | URLs no Supabase Storage; bucket público; domínio `*.supabase.co` já permitido no app. |

---

## 8. O que observar no primeiro uso real

- Pedidos em **aguardando aprovação** após pagamento: aprovar no admin.
- Notificações falhas no painel **Mercado Pago**.
- Erros 5xx nas **Functions/Logs** da Vercel (checkout e `/api/webhooks/mercado-pago`).

---

*Última revisão: ETAPA 13 — go-live assistido.*
