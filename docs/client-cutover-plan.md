# Plano de entrada — base e configuração do cliente

Objetivo: trocar ambiente de desenvolvimento/demo pela **conta real** da loja, sem surpresas.

---

## 1. O que migrar / configurar

| Item | Ação |
|------|------|
| **Projeto Supabase** | Novo projeto (ou existente) só da marca; não misturar com demo. |
| **Migrations** | `supabase db push` (remoto) após `pnpm db:floricultura:sync` se alterou SQL em `migrations/`. |
| **Dados iniciais** | Settings, categorias, produtos, imagens (Storage), banners, `shipping_rules` — via Studio, SQL ou import acordado. **Não** rodar seed demo em produção. |
| **Admin(s)** | Auth: criar usuário(s) + `INSERT` em `public.admins`. |
| **Envs Vercel** | `NEXT_PUBLIC_*`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, MP, `PAYMENT_SYNC_SECRET`. |
| **Domínio** | DNS → Vercel; alinhar `NEXT_PUBLIC_SITE_URL` + redploy. |
| **Mercado Pago** | Token produção; webhook `https://<domínio>/api/webhooks/mercado-pago`. |
| **Pedidos/pagamentos demo** | Zerar ou não migrar; produção começa limpa. |

---

## 2. Ordem recomendada

1. Criar projeto Supabase do cliente.  
2. `supabase link` + `supabase db push` (schema).  
3. Criar primeiro admin (Auth + `admins`).  
4. Cadastrar base mínima (settings, frete, 1 categoria, 1 produto teste).  
5. Configurar envs na Vercel (Preview opcional, Production obrigatório).  
6. Deploy; apontar domínio; atualizar `NEXT_PUBLIC_SITE_URL` + redeploy.  
7. Configurar webhook MP.  
8. Smoke test (`docs/smoke-test-go-live.md` ou `docs/runbook-mvp-tests.md` seção produção).  
9. Liberar operação e treinar lojista (`docs/handoff-operacao.md`).

---

## 3. Seed demo vs produção

| Ambiente | Seed demo (`supabase/seed.sql` / `db reset` local) |
|----------|---------------------------------------------------|
| Dev local / homolog | **Sim** — acelera testes. |
| Produção cliente | **Não** — dados reais apenas; pedido `FD-2024-0001` e clientes fictícios confundem operação. |

**Cuidado:** se alguém rodar `db reset` em projeto remoto por engano, apaga dados.

---

## 4. Checklist de corte (base pronta)

**Pronto quando:**

- [ ] Schema aplicado sem erro.  
- [ ] Pelo menos 1 admin ativo consegue logar em `/admin`.  
- [ ] Catálogo mínimo visível no site.  
- [ ] 1 pedido de teste (offline) criado e visível no admin + página pública.  
- [ ] Envs e domínio corretos; MP testado se venda online ativa.

**Bloqueia produção:**

- Service role ausente ou errada (checkout/webhook quebrados).  
- `NEXT_PUBLIC_SITE_URL` divergente do domínio (MP e links errados).  
- Nenhum admin em `admins`.  
- Sem regra de frete quando entrega está habilitada.

---

Ver também: `docs/deploy-checklist.md`, `docs/handoff-operacao.md`.
