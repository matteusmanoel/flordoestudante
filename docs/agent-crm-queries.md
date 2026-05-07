# CRM Mínimo — Queries e Endpoints para o Painel Admin (Sprint 12)

Este documento mapeia as queries SQL, RPCs e endpoints necessários para integrar
o CRM de conversas WhatsApp no painel admin Next.js existente (`apps/floricultura-web/app/admin/`).

---

## 1. Views disponíveis (criadas em 00020_flor_handoff_tools.sql)

### `vw_admin_conversations`
Lista todas as conversas com última mensagem, status e pedido atual.

```sql
-- Listar conversas ativas (não finalizadas)
SELECT *
FROM vw_admin_conversations
WHERE stage NOT IN ('finalizado')
ORDER BY last_message_at DESC NULLS LAST
LIMIT 50;

-- Apenas conversas aguardando atendimento humano
SELECT *
FROM vw_admin_conversations
WHERE human_takeover = true
   OR stage IN ('handoff', 'human_takeover')
ORDER BY last_message_at DESC;
```

### `vw_admin_whatsapp_orders`
Pedidos com origem WhatsApp, incluindo stage da conversa.

```sql
-- Pedidos WhatsApp pendentes (draft ou aguardando aprovação)
SELECT *
FROM vw_admin_whatsapp_orders
WHERE status IN ('draft', 'awaiting_approval', 'paid')
ORDER BY created_at DESC;
```

---

## 2. RPCs disponíveis para o CRM

### `flor_get_conversation_context(p_phone_normalized, p_channel)`
Retorna contexto completo para exibição na tela de conversa do admin.

```typescript
// Server Action no Next.js
const { data } = await supabase.rpc('flor_get_conversation_context', {
  p_phone_normalized: phone,
  p_channel: 'whatsapp',
  p_recent_messages_limit: 30
});
```

### `flor_admin_assume_conversation(p_conversation_id, p_admin_id, p_note)`
Seta `human_takeover = true` e registra admin. Deve ser chamada quando o admin abre
uma conversa e decide responder manualmente. **Deve também setar o Redis human_lock
via Evolution API ou n8n trigger auxiliar.**

```typescript
const { data } = await supabase.rpc('flor_admin_assume_conversation', {
  p_conversation_id: conversationId,
  p_admin_id: adminId,
  p_note: 'Assumido via painel'
});
// TODO Sprint 12: após assume, setar Redis human_lock via API route auxiliar
```

### `flor_admin_release_conversation(p_conversation_id, p_admin_id)`
Libera conversa para o agente IA retomar. Deve limpar o Redis human_lock.

```typescript
const { data } = await supabase.rpc('flor_admin_release_conversation', {
  p_conversation_id: conversationId,
  p_admin_id: adminId
});
// TODO Sprint 12: após release, DEL Redis human_lock via API route auxiliar
```

---

## 3. Endpoints de API a criar em `apps/floricultura-web/app/api/`

### `GET /api/admin/conversations`
Lista conversas para o painel CRM.

```typescript
// app/api/admin/conversations/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminSession } from '@/features/admin/auth';

export async function GET(request: Request) {
  await requireAdminSession();
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // 'handoff' | 'active' | 'all'

  let query = supabase
    .from('vw_admin_conversations')
    .select('*')
    .order('last_message_at', { ascending: false })
    .limit(50);

  if (status === 'handoff') {
    query = query.eq('human_takeover', true);
  } else if (status === 'active') {
    query = query.not('stage', 'in', '("finalizado","human_takeover")');
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ conversations: data });
}
```

### `GET /api/admin/conversations/[id]`
Retorna detalhes de uma conversa com mensagens.

```typescript
// app/api/admin/conversations/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  await requireAdminSession();
  const supabase = createServerClient();

  const { data } = await supabase.rpc('flor_get_conversation_context', {
    p_phone_normalized: '', // buscar por conversation_id é necessário
    p_channel: 'whatsapp',
    p_recent_messages_limit: 50
  });

  // Buscar mensagens diretamente por conversation_id
  const { data: messages } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('conversation_id', params.id)
    .order('sent_at', { ascending: true });

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, customers(*), orders!source_conversation_id(*)')
    .eq('id', params.id)
    .single();

  return Response.json({ conversation, messages });
}
```

### `POST /api/admin/conversations/[id]/assume`
Admin assume o atendimento.

```typescript
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdminSession();
  const supabase = createServerClient();

  await supabase.rpc('flor_admin_assume_conversation', {
    p_conversation_id: params.id,
    p_admin_id: admin.id,
    p_note: 'Assumido via painel CRM'
  });

  // Setar human_lock no Redis via variável de ambiente
  // Isso pode ser feito via fetch para uma n8n webhook de controle
  // ou via Redis direto se houver SDK disponível

  return Response.json({ ok: true });
}
```

### `POST /api/admin/conversations/[id]/release`
Admin libera conversa para o agente IA.

```typescript
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdminSession();
  const supabase = createServerClient();

  await supabase.rpc('flor_admin_release_conversation', {
    p_conversation_id: params.id,
    p_admin_id: admin.id
  });

  // DEL human_lock no Redis
  // ...

  return Response.json({ ok: true });
}
```

---

## 4. Página CRM no Admin (rota sugerida)

**Rota:** `app/admin/conversas/page.tsx`

### Funcionalidades mínimas:
- Lista de conversas com badge por status (human_takeover, stage)
- Badge vermelho para conversas com `human_takeover = true`
- Clique na conversa → abre histórico de mensagens
- Botão "Assumir" → chama `/api/admin/conversations/[id]/assume`
- Botão "Liberar para IA" → chama `/api/admin/conversations/[id]/release`
- Link para o pedido se `current_order_id` existir

### Queries de suporte:

```sql
-- Contagem para badge no menu admin
SELECT
  COUNT(*) FILTER (WHERE human_takeover = true) AS aguardando_humano,
  COUNT(*) FILTER (WHERE stage = 'handoff') AS em_handoff,
  COUNT(*) FILTER (WHERE stage NOT IN ('finalizado','human_takeover','handoff')) AS ativas
FROM conversations
WHERE last_message_at > now() - interval '24 hours';
```

---

## 5. Integração Redis para human_lock no CRM

O Redis `human_lock` é definido/removido pelo workflow n8n.
Para que o painel admin também controle o lock, criar uma n8n webhook auxiliar:

### Webhook n8n: `/admin-lock`
- `POST {"phone": "...", "action": "lock" | "unlock"}`
- Executa: `SET flor:human_lock:{phone} "1" EX 28800` (lock) ou `DEL flor:human_lock:{phone}` (unlock)
- Retorna `{ ok: true }`

Essa webhook é chamada pelo Next.js nas rotas de assume/release como um fetch interno.

---

## 6. Variáveis de ambiente necessárias para Sprint 12

```env
# Em apps/floricultura-web/.env.local
N8N_ADMIN_LOCK_WEBHOOK_URL=https://seu-n8n.com/webhook/admin-lock
N8N_ADMIN_LOCK_WEBHOOK_SECRET=seu_secret_aqui
```

---

## 7. Próximos passos CRM

- [ ] Criar `app/admin/conversas/page.tsx` com lista e filtros
- [ ] Criar `app/admin/conversas/[id]/page.tsx` com chat viewer
- [ ] Implementar WebSocket/realtime via Supabase Realtime para mensagens ao vivo
- [ ] Criar n8n webhook auxiliar de admin-lock
- [ ] Adicionar link "Conversas" no menu admin (`app/admin/layout.tsx`)
- [ ] Adicionar contagem de conversas aguardando humano no dashboard admin
