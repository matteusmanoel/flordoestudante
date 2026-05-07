# MVP Agent — Checklist de Deploy

Este documento guia o deploy completo do agente WhatsApp da Flor do Estudante
a partir do estado atual (pós run MVP Ready de 06/05/2026).

Execute **na ordem exata** abaixo. Não pule etapas.

---

## FASE 1 — Banco de dados (Supabase)

### 1.1 Rotacionar credenciais expostas

- [ ] Acessar Supabase Dashboard → projeto `nldwghtcewsgrzkbxcyx` → Settings → API
- [ ] **Regenerar** a chave `service_role`
- [ ] Copiar a nova chave (vai ser usada no n8n na Fase 2)
- [ ] **NÃO** usar a chave hardcoded no arquivo `workflows/FLOR | WhatsApp Inbound Principal | Sprint 3A.json`
- [ ] Anotar nova chave em local seguro (ex: 1Password, vault)

### 1.2 Aplicar migration 00025

```sql
-- Abrir Supabase Dashboard → SQL Editor → Novo query
-- Colar conteúdo de: supabase/floricultura/migrations/00025_flor_mvp_agent_rpcs.sql
-- Executar (pode demorar ~5s)
```

Verificar que não houve erro. Se houver, verificar logs do SQL Editor.

### 1.3 Validar RPCs criadas

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'flor_%'
ORDER BY routine_name;
```

Esperado: 9 funções listadas (incluindo `flor_register_inbound_sprint3`):
- `flor_create_order_draft`
- `flor_get_conversation_context`
- `flor_log_media_event`
- `flor_parse_whatsapp_cart`
- `flor_prepare_checkout`
- `flor_register_agent_exchange`
- `flor_register_inbound_sprint3`
- `flor_trigger_handoff`
- `flor_update_order_draft`

### 1.4 Validar colunas de mídia

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'conversation_messages'
  AND column_name IN ('transcription', 'visual_description');
```

Esperado: 2 linhas retornadas.

### 1.5 Validar tags dia das mães

```sql
SELECT COUNT(*) FROM products
WHERE 'dia_das_maes' = ANY(occasion_tags) AND is_active = true;
```

Esperado: ≥ 1 produto (os 3 produtos existentes devem estar tagueados).

### 1.6 Testar RPC get_conversation_context

```sql
SELECT public.flor_get_conversation_context('5545988230845');
```

Esperado: JSON com `customer`, `conversation`, `recent_messages` (pode ser vazio).

### 1.7 Verificar enum constraints

```sql
-- Confirmar valores do enum order_status
SELECT enumlabel FROM pg_enum
JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
WHERE pg_type.typname = 'order_status'
ORDER BY enumsortorder;

-- Confirmar valores do enum fulfillment_type
SELECT enumlabel FROM pg_enum
JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
WHERE pg_type.typname = 'fulfillment_type';

-- Confirmar valores do enum payment_method
SELECT enumlabel FROM pg_enum
JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
WHERE pg_type.typname = 'payment_method';
```

---

## FASE 2 — n8n: Credenciais e variáveis

### 2.1 Criar/atualizar credencial Redis

- [ ] Acessar n8n → Settings → Credentials → New
- [ ] Tipo: **Redis**
- [ ] Nome: `redis_cloudfy`
- [ ] Host: `<host Redis>` (Upstash ou self-hosted)
- [ ] Port: `6380` (Upstash TLS) ou `6379`
- [ ] Password: `<senha Redis>`
- [ ] TLS: habilitado (Upstash)
- [ ] Testar conexão → OK

### 2.2 Criar credencial OpenAI

- [ ] Tipo: **OpenAI API**
- [ ] Nome: `OpenAI Flor`
- [ ] API Key: `<sua chave OpenAI>`
- [ ] Testar → OK

### 2.3 Criar variáveis de ambiente no n8n

Acessar n8n → Settings → Variables:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | `https://nldwghtcewsgrzkbxcyx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `<nova service_role key da Fase 1.1>` |
| `EVOLUTION_BASE_URL` | `https://cheatingbat-evolution.cloudfy.live` |
| `EVOLUTION_INSTANCE` | `julia` |
| `EVOLUTION_API_KEY` | `<Evolution API key — rotacionar se necessário>` |
| `CATALOG_BASE_URL` | `https://floricultura.vercel.app` (atualizar após deploy do Next.js) |
| `OPENROUTER_API_KEY` | `<chave OpenRouter>` |

> **NUNCA** colocar credenciais diretamente no JSON dos workflows.

### 2.4 Testar conectividade Supabase

Criar um HTTP Request manual no n8n:
- URL: `{{ $vars.SUPABASE_URL }}/rest/v1/rpc/flor_get_conversation_context`
- Headers: `apikey: {{ $vars.SUPABASE_SERVICE_KEY }}`, `Authorization: Bearer {{ $vars.SUPABASE_SERVICE_KEY }}`
- Body: `{ "p_phone_normalized": "5545988230845" }`
- Esperado: 200 com JSON

---

## FASE 3 — n8n: Importação de workflows

### 3.1 Importar subworkflows PRIMEIRO

**Ordem obrigatória:**

1. Importar `workflows/FLOR | Tool Search Catalog | MVP.json`
   - Verificar que o n8n aceita o import sem erros de schema
   - Anotar o ID do workflow gerado (será referenciado pelo principal)
   - **Não ativar ainda**

2. Importar `workflows/FLOR | Tool Media Process | MVP.json`
   - Verificar import sem erros
   - **Não ativar ainda**

3. Importar `workflows/FLOR | WhatsApp Inbound Principal | MVP Ready.json`
   - Verificar import sem erros
   - **Não ativar ainda**

### 3.2 Verificar credenciais nos nodes importados

Após importar o MVP Ready, verificar que todos os nodes Redis apontam para a credencial `redis_cloudfy`:
- REDIS: GET HUMAN LOCK | MVP
- REDIS: SET LAST MSG ID | MVP
- REDIS: GET LAST MSG ID | MVP
- REDIS: GET LAST MSG ID CHECK | MVP
- REDIS: GET BUFFER | MVP
- REDIS: SET BUFFER | MVP
- REDIS: SET SESSION | MVP
- REDIS: DEL BUFFER | MVP
- REDIS: SET HUMAN LOCK | MVP

Verificar que o node OpenAI aponta para `OpenAI Flor`.

### 3.3 Configurar webhook Evolution

- [ ] Anotar a URL do webhook do workflow MVP Ready (após ativar)
  - Formato: `https://<seu-n8n>/webhook/flor-whatsapp-mvp`
- [ ] Configurar na Evolution API como webhook para a instância `julia`
- [ ] Tipo de evento: `MESSAGES_UPSERT` (ou equivalente)

### 3.4 Ativar workflows

- [ ] Ativar `FLOR | Tool Search Catalog | MVP`
- [ ] Ativar `FLOR | Tool Media Process | MVP`
- [ ] Ativar `FLOR | WhatsApp Inbound Principal | MVP Ready`
- [ ] **Manter desativados** os workflows Sprint 3A, 4A, 5A e 6A (referência histórica)

---

## FASE 4 — Testes iniciais

### 4.1 Teste de smoke (5 minutos)

Enviar para o WhatsApp da instância `julia`:

1. `"Oi"` — Esperado: saudação Dia das Mães, sem handoff
2. `"Quero flores para minha mãe"` — Esperado: busca catálogo, lista produtos com links
3. `"Quero falar com uma pessoa"` — Esperado: handoff, human_lock setado

Verificar no n8n: execuções completas sem erro vermelho.

### 4.2 Verificar Supabase após smoke test

```sql
-- Verificar customer criado
SELECT id, full_name, phone_normalized FROM customers ORDER BY created_at DESC LIMIT 5;

-- Verificar conversa aberta
SELECT id, stage, status, human_takeover FROM conversations ORDER BY created_at DESC LIMIT 5;

-- Verificar mensagens
SELECT direction, sender_type, message_type, body, agent_action, agent_stage
FROM conversation_messages ORDER BY created_at DESC LIMIT 10;

-- Verificar eventos
SELECT event_type, action, input_json->>'message_type', output_json->>'stage'
FROM agent_events ORDER BY created_at DESC LIMIT 10;
```

### 4.3 Verificar Redis após smoke test

```bash
# Verificar chaves criadas
redis-cli KEYS "flor:*"

# Verificar sessão
redis-cli GET "flor:session:<phone_normalized>"

# Verificar human lock (após cenário 3)
redis-cli GET "flor:human_lock:<phone_normalized>"
redis-cli TTL "flor:human_lock:<phone_normalized>"
# Esperado TTL: próximo a 28800 (8h)
```

### 4.4 Executar matriz de testes MVP

Executar os cenários M01–M20 de `docs/agent-test-matrix.md` em sequência.
Marcar status de cada cenário.

---

## FASE 5 — Configurações pós-deploy

### 5.1 Atualizar CATALOG_BASE_URL após deploy Next.js

```
n8n Settings → Variables → CATALOG_BASE_URL → <URL real do Vercel>
```

Verificar que links nos produtos usam a URL correta.

### 5.2 Adicionar produtos reais ao catálogo

O banco de produção tem apenas 3 produtos de seed. Para Dia das Mães:
1. Importar planilha XLSX via admin (`/admin/produtos/importar`)
2. Verificar que `occasion_tags` contém `dia_das_maes` nos novos produtos

```sql
-- Taguear novos produtos ativos com dia_das_maes
UPDATE products
SET occasion_tags = array_append(
  COALESCE(occasion_tags, '{}'), 'dia_das_maes'
)
WHERE is_active = true
  AND NOT ('dia_das_maes' = ANY(COALESCE(occasion_tags, '{}')));
```

### 5.3 Configurar Evolution webhook

- [ ] Verificar que Evolution entrega eventos para a URL do MVP Ready
- [ ] Testar com mensagem real do WhatsApp
- [ ] Confirmar que o formato do payload bate com o normalizer

### 5.4 Configurar shipping rule (taxa de entrega)

```sql
-- Verificar se existe taxa de entrega
SELECT * FROM shipping_rules WHERE is_active = true;

-- Se não existir, inserir:
INSERT INTO shipping_rules (name, rule_type, amount, description, is_active)
VALUES ('Entrega padrão', 'fixed', 15.00, 'Taxa de entrega fixa para Cascavel/região', true);
```

---

## FASE 6 — Segurança (pré-produção)

### 6.1 Revisar RLS

O arquivo `supabase/floricultura/migrations/00024_security_rls_policies.sql` contém
proposta de RLS para as tabelas de agente. Revisar antes de aplicar.

Tabelas atualmente sem RLS:
- `conversations`
- `conversation_messages`
- `agent_events`
- `catalog_item_aliases`
- `catalog_import_batches`
- `catalog_import_items`

**Não aplicar RLS sem revisar as policies** — habilitar sem policies bloqueia todo acesso.

### 6.2 Verificar que service_role key está apenas em variáveis n8n

```bash
# Verificar se alguma key está hardcoded nos workflows (não deve haver)
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" workflows/
# Deve retornar apenas Sprint 3A.json (workflow histórico, desativado)
```

---

## FASE 7 — Monitoramento contínuo

### 7.1 Alertas recomendados

- [ ] Supabase: alerta de erro em `agent_events` (event_type = 'media_processing_error')
- [ ] n8n: alerta de execução com erro (workflow MVP Ready)
- [ ] Redis: alerta de memória acima de 80%

### 7.2 Queries de monitoramento

```sql
-- Conversas abertas com handoff aguardando
SELECT COUNT(*) FROM conversations
WHERE human_takeover = true AND status = 'pending'
  AND last_message_at > now() - interval '4 hours';

-- Pedidos draft sem atualização há mais de 1h (possível abandono)
SELECT id, public_code, created_at FROM orders
WHERE status = 'draft'
  AND updated_at < now() - interval '1 hour';

-- Erros de agente nas últimas 24h
SELECT event_type, action, error_json, created_at FROM agent_events
WHERE event_type LIKE '%error%'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- Volume de mensagens por hora (hoje)
SELECT date_trunc('hour', created_at) AS hora, COUNT(*) AS mensagens
FROM conversation_messages
WHERE direction = 'inbound'
  AND created_at >= current_date
GROUP BY 1 ORDER BY 1;
```

---

## Resumo rápido (ordem de execução)

```
1. Supabase: rotacionar service_role key
2. Supabase: aplicar 00025_flor_mvp_agent_rpcs.sql
3. Supabase: validar RPCs e colunas
4. n8n: criar credenciais Redis + OpenAI
5. n8n: configurar variáveis (SUPABASE_URL, SERVICE_KEY, EVOLUTION_*, CATALOG_BASE_URL, OPENROUTER_API_KEY)
6. n8n: importar Tool Search Catalog MVP
7. n8n: importar Tool Media Process MVP
8. n8n: importar WhatsApp Inbound Principal MVP Ready
9. n8n: verificar credenciais Redis e OpenAI nos nodes
10. Evolution: configurar webhook para URL do MVP Ready
11. n8n: ativar os 3 workflows MVP
12. Testar smoke (3 mensagens básicas)
13. Verificar Supabase e Redis após smoke
14. Executar matriz M01–M20
15. Adicionar produtos reais ao catálogo
16. Atualizar CATALOG_BASE_URL após deploy Next.js
```
