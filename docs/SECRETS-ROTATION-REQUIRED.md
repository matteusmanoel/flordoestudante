# AÇÃO URGENTE — Rotação de Credenciais Expostas

> **Atualizado:** 06/05/2026 — run MVP Ready de conclusão do agente

O arquivo `workflows/FLOR | WhatsApp Inbound Principal | Sprint 3A.json`
contém credenciais reais hardcoded. Elas foram identificadas e **precisam ser
rotacionadas imediatamente** antes de qualquer deploy ou uso em produção.

---

## 1. Supabase service_role JWT

**Projeto:** `nldwghtcewsgrzkbxcyx.supabase.co`

**Confirmado hardcoded em:** `Sprint 3A.json` nos nodes de HTTP Request (header `apikey` e `Authorization`).

**Como rotacionar:**
1. Acesse o Supabase Dashboard → projeto Flor do Estudante
2. Settings → API
3. Role da seção "Project API keys" e clique em **Regenerate** na chave `service_role`
4. Copie a nova chave
5. Configure no n8n como variável: `SUPABASE_SERVICE_KEY` (ver Fase 2 do deploy checklist)
6. **Nunca** insira a chave diretamente em JSON de workflow
7. Atualize `.env` / `.env.local` em `apps/floricultura-web` se necessário

**NUNCA commite** a service_role key em arquivos de workflow.

> **Nota MVP Ready:** Os workflows `Tool Search Catalog | MVP`, `Tool Media Process | MVP`
> e `WhatsApp Inbound Principal | MVP Ready` usam **exclusivamente** `$vars.SUPABASE_SERVICE_KEY`
> (variável de ambiente n8n), sem nenhuma credencial hardcoded.

---

## 2. Evolution API Key

**Instância:** `julia`
**Base URL:** `https://cheatingbat-evolution.cloudfy.live`

**Confirmado hardcoded em:** `Sprint 3A.json` nos nodes Evolution.

**Como rotacionar:**
1. Acesse o painel de administração da Evolution API
2. Regenere a API key da instância `julia`
3. Copie a nova chave
4. Configure no n8n como variável: `EVOLUTION_API_KEY`

> **Nota MVP Ready:** O workflow MVP Ready usa `$vars.EVOLUTION_API_KEY` em todos os nodes Evolution.

---

## 3. Workflows que contêm credenciais hardcoded

| Arquivo | Credencial exposta | Status recomendado |
|---|---|---|
| `Sprint 3A.json` | `service_role` JWT + Evolution API key | Desativar, não deletar (histórico) |
| `Sprint 4A.json` | Placeholder (verificar) | Verificar se usa $vars |
| `Sprint 5A.json` | Placeholder (verificar) | Verificar se usa $vars |
| `Sprint 6A.json` | Placeholder (verificar) | Verificar se usa $vars |
| `Tool Search Catalog | MVP.json` | `$vars` apenas | ✅ Seguro |
| `Tool Media Process | MVP.json` | `$vars` apenas | ✅ Seguro |
| `MVP Ready.json` | `$vars` apenas | ✅ Seguro |

---

## 4. Como configurar credenciais no n8n (MVP Ready)

O workflow MVP Ready usa **variáveis n8n (`$vars`)** para todas as chamadas externas.
Não usa credenciais hardcoded.

### Variáveis obrigatórias (n8n → Settings → Variables)

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | `https://nldwghtcewsgrzkbxcyx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | service_role JWT (nova, após rotação) |
| `EVOLUTION_BASE_URL` | `https://cheatingbat-evolution.cloudfy.live` |
| `EVOLUTION_INSTANCE` | `julia` |
| `EVOLUTION_API_KEY` | Evolution API key (nova, após rotação) |
| `CATALOG_BASE_URL` | URL pública do Next.js (ex: `https://floricultura.vercel.app`) |
| `OPENROUTER_API_KEY` | Chave OpenRouter para chat + vision |

### Credencial Redis (n8n nativo)
- Type: **Redis**
- Name: `redis_cloudfy`
- Host: `<host Upstash ou self-hosted>`
- Port: `6380` (Upstash) ou `6379`
- Password: `<senha Redis>`
- TLS: habilitado (Upstash)

### Credencial OpenAI (n8n nativo)
- Type: **OpenAI API**
- Name: `OpenAI Flor`
- API Key: `<sua chave OpenAI>` (usada pelo node de transcription Whisper)

---

## 5. Checklist pós-rotação (MVP Ready)

- [ ] Supabase service_role key **rotacionada** no Dashboard
- [ ] Nova service_role key configurada em `n8n Variables → SUPABASE_SERVICE_KEY`
- [ ] Evolution API key **rotacionada** no painel Evolution
- [ ] Nova Evolution key configurada em `n8n Variables → EVOLUTION_API_KEY`
- [ ] Credencial Redis `redis_cloudfy` criada e testada no n8n
- [ ] Credencial OpenAI `OpenAI Flor` criada e testada no n8n
- [ ] Sprint 3A **desativado** no n8n (workflow inativo, não deletar)
- [ ] MVP Ready importado e ativado com variáveis corretas
- [ ] Teste de envio via WhatsApp validado (cenário M01)
- [ ] `.env.local` apps/floricultura-web atualizado com nova SUPABASE_SERVICE_ROLE_KEY
- [ ] **Não remover** Sprint 3A.json do repositório (referência histórica do normalizer validado)

---

## 6. Verificação de segurança pós-rotação

```bash
# Verificar se alguma service_role key antiga está nos workflows ativos (não deve haver)
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" workflows/

# Deve retornar APENAS o Sprint 3A.json
# Se retornar MVP Ready ou outros workflows ativos, corrigir imediatamente
```

---

## 7. Nota sobre o arquivo Sprint 3A.json

O arquivo original **não foi alterado** para preservar a referência histórica.
Ele contém a versão validada do normalizer `normalizeBrazilWhatsappPhone` que foi
reaproveitada no MVP Ready.

Se o repositório for público ou compartilhado, substitua os valores
sensíveis manualmente no Sprint 3A.json ou use `git filter-branch` / BFG Repo Cleaner
para remover do histórico git.
