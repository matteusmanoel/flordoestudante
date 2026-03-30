# Plano de fechamento — MVP Floricultura

## Estado após FASE FINAL

| Área | Status |
|------|--------|
| Catálogo, carrinho, checkout, MP/offline, pedido público | Concluído |
| Admin: login Supabase, lista pedidos, detalhe, status, prazo (texto), nota interna, qtd/substituição de itens | **Concluído** |
| Página pública: exibe prazo quando preenchido pelo admin | Concluído |
| Docker Compose Postgres (raiz) | Concluído (auxiliar) |
| Seeds Supabase (`db seed` / `db reset`) | Concluído (`config.toml` explícito) |
| Runbook QA | `docs/runbook-mvp-tests.md` |

## Riscos remanescentes

- Postgres Docker **sem** stack Supabase não roda o app ponta a ponta.
- Webhook MP em local exige tunnel.
- CRUD catálogo via UI admin fora do MVP (usar Studio/SQL).

## Ordem que foi executada

1. Auditoria → plano  
2. Docker + scripts raiz  
3. Seeds declarados no `config.toml`  
4. Implementação admin + ajustes UX prazo  
5. Runbook + docs  
6. lint / typecheck / build  
