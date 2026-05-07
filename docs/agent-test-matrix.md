# Matriz de Testes de Regressão — Agente WhatsApp Flor do Estudante (Sprint 6A)

Executar este checklist manualmente após cada deploy ou alteração nos workflows.
Para cada cenário: verificar resposta, logs no Supabase e ausência de duplicidade.

---

## Configuração do ambiente de teste

- **Número de teste:** usar número pessoal ou número de teste configurado
- **Instância Evolution:** `julia` (ou conforme configurado)
- **Supabase:** verificar logs em `conversation_messages` e `agent_events`
- **Redis:** verificar chaves via Redis CLI ou Upstash Console
- **n8n:** verificar execuções em "Executions"

---

## Cenário 01 — Saudação simples

**Input:** `"Oi"`

| Critério | Esperado | Status |
|---|---|---|
| should_process | true | ☐ |
| Redis buffer criado | flor:buffer:{phone} | ☐ |
| RPC chamada | flor_register_agent_exchange | ☐ |
| action | smalltalk ou ask_info | ☐ |
| reply contém saudação | "Olá" / "Bem-vindo" / nome Julia | ☐ |
| Mensagem enviada via Evolution | ✓ | ☐ |
| 1 mensagem registrada em conversation_messages | direction=inbound | ☐ |
| 1 mensagem outbound registrada | direction=outbound | ☐ |

---

## Cenário 02 — Buffer anti-duplicidade (2 mensagens em sequência < 2s)

**Input:** `"Oi"` imediatamente seguido de `"tudo bem"`

| Critério | Esperado | Status |
|---|---|---|
| 2 inbounds no banco | ✓ | ☐ |
| Apenas 1 resposta enviada via Evolution | ✓ (não 2) | ☐ |
| buffer_count = 2 | em agent_events payload | ☐ |
| message_text da execução processadora | "Oi\ntudo bem" (merged) | ☐ |

---

## Cenário 03 — Filtro fromMe

**Input:** Enviar mensagem a partir da própria conta WhatsApp conectada

| Critério | Esperado | Status |
|---|---|---|
| should_process | false | ☐ |
| ignore_reason | "fromMe" | ☐ |
| Nenhuma persistência no Supabase | ✓ | ☐ |
| Nenhuma resposta enviada | ✓ | ☐ |

---

## Cenário 04 — Filtro de grupo

**Input:** Mensagem enviada via grupo WhatsApp (remoteJid contém @g.us)

| Critério | Esperado | Status |
|---|---|---|
| should_process | false | ☐ |
| ignore_reason | "grupo" | ☐ |
| Nenhuma persistência | ✓ | ☐ |

---

## Cenário 05 — Human lock ativo

**Setup:** `SET flor:human_lock:{phone} "1" EX 28800` no Redis

**Input:** `"Quero flores"`

| Critério | Esperado | Status |
|---|---|---|
| Webhook responde 200 | ✓ | ☐ |
| Nenhuma resposta enviada ao cliente | ✓ | ☐ |
| Nenhuma chamada ao OpenAI | ✓ | ☐ |

**Cleanup:** `DEL flor:human_lock:{phone}`

---

## Cenário 06 — Interesse genérico em flores

**Input:** `"Quero flores para minha mãe"`

| Critério | Esperado | Status |
|---|---|---|
| action | ask_info ou search_catalog | ☐ |
| stage | coletando_ocasiao ou consultando_catalogo | ☐ |
| reply pergunta ocasião ou data | ✓ | ☐ |
| SEM mencionar preços sem buscar catálogo | ✓ | ☐ |

---

## Cenário 07 — Urgência hoje

**Input:** `"Preciso para hoje à tarde"`

| Critério | Esperado | Status |
|---|---|---|
| intent.urgency | "hoje" ou similar | ☐ |
| action | search_catalog com p_same_day_only=true | ☐ |
| RPC search_ready_catalog_for_agent chamada | ✓ | ☐ |
| Produtos same_day_available retornados | ✓ | ☐ |
| reply não inventa produtos não cadastrados | ✓ | ☐ |

---

## Cenário 08 — Restrição de orçamento

**Input:** `"Tenho até R$ 150"`

| Critério | Esperado | Status |
|---|---|---|
| catalog.max_budget | 150 | ☐ |
| action | search_catalog com p_max_budget=150 | ☐ |
| Produtos retornados todos abaixo de R$150 | ✓ | ☐ |
| reply lista opções com preço | ✓ | ☐ |

---

## Cenário 09 — Busca por produto específico (buquê de rosas)

**Input:** `"Quero um buquê de rosas"`

| Critério | Esperado | Status |
|---|---|---|
| catalog.product_interest | "rosas" ou "buquê" | ☐ |
| action | search_catalog | ☐ |
| RPC busca por query "rosas" | ✓ | ☐ |
| Catálogo real consultado (não inventado) | ✓ | ☐ |

---

## Cenário 10 — Produto por ocasião (aniversário)

**Input:** `"É um presente de aniversário"`

| Critério | Esperado | Status |
|---|---|---|
| intent.occasion | "aniversario" | ☐ |
| action | search_catalog com p_occasion="aniversario" | ☐ |
| stage | coletando_ocasiao → consultando_catalogo | ☐ |

---

## Cenário 11 — Entrega em endereço

**Input:** `"Entrega no centro de Cascavel, Rua das Flores 123"`

| Critério | Esperado | Status |
|---|---|---|
| action | collect_delivery_data ou update_order_draft | ☐ |
| delivery.city | "Cascavel" | ☐ |
| delivery.street | populado | ☐ |
| stage | coletando_entrega_ou_retirada | ☐ |

---

## Cenário 12 — Entrega surpresa

**Input:** `"É uma surpresa, o destinatário não pode saber"`

| Critério | Esperado | Status |
|---|---|---|
| recipient.is_surprise | true | ☐ |
| order.surprise_delivery | true (se pedido existe) | ☐ |
| reply adequado sobre surpresa | ✓ | ☐ |

---

## Cenário 13 — Mensagem no cartão

**Input:** `"Pode colocar no cartão: Te amo muito, mãe!"`

| Critério | Esperado | Status |
|---|---|---|
| action | collect_gift_message ou update_order_draft | ☐ |
| gift.gift_message | "Te amo muito, mãe!" | ☐ |
| gift.has_card_message | true | ☐ |
| stage | coletando_mensagem_cartao → aguardando_confirmacao | ☐ |

---

## Cenário 14 — Fechar pedido ("Pode fechar")

**Input:** `"Pode fechar o pedido"` (cliente já escolheu produto, tem pedido em andamento)

> **CORRIGIDO (MVP Ready):** O agente **não deve acionar handoff** apenas para fechar pedido.
> Deve criar/atualizar o draft e perguntar sobre entrega ou pagamento de forma autônoma.

| Critério | Esperado | Status |
|---|---|---|
| action | create_order_draft OU update_order_draft | ☐ |
| NÃO action = handoff_human | ✓ | ☐ |
| RPC flor_create_order_draft OU flor_update_order_draft chamada | ✓ | ☐ |
| conversation.human_takeover | false (bot continua) | ☐ |
| Redis human_lock | NÃO setado | ☐ |
| reply confirma pedido e pergunta sobre entrega/pagamento | ✓ | ☐ |
| reply contém código ou link do pedido | ✓ | ☐ |

---

## Cenário 15 — Solicitação de pagamento via Pix / Fechar com pagamento

**Input:** `"Quero pagar no Pix"` (após pedido draft existente)

> **CORRIGIDO (MVP Ready):** O agente **deve chamar prepare_checkout** de forma autônoma
> e enviar o link de pagamento. Handoff apenas se checkout falhar ou não houver pedido.

| Critério | Esperado | Status |
|---|---|---|
| action | prepare_checkout | ☐ |
| NÃO action = handoff_human | ✓ | ☐ |
| RPC flor_prepare_checkout chamada | ✓ | ☐ |
| checkout_url formato | {CATALOG_BASE_URL}/pedido/{code}/pagamento | ☐ |
| order.status no banco | pending_payment | ☐ |
| reply contém link de pagamento | ✓ | ☐ |
| reply contém resumo do pedido | ✓ | ☐ |
| flor_register_agent_exchange chamada | p_agent_action = prepare_checkout | ☐ |

---

## Cenário 16 — Solicita atendente humano

**Input:** `"Quero falar com uma pessoa"`

| Critério | Esperado | Status |
|---|---|---|
| action | handoff_human | ☐ |
| flor_trigger_handoff chamada | ✓ | ☐ |
| human_takeover | true | ☐ |
| reply empático e cordial | ✓ | ☐ |
| Redis human_lock setado | ✓ | ☐ |

---

## Cenário 17 — Carrinho WhatsApp (orderMessage)

**Setup:** Enviar um pedido via WhatsApp com itens (funcionalidade Evolution)

**Input:** `[payload Evolution orderMessage com 2+ itens]`

| Critério | Esperado | Status |
|---|---|---|
| message_type detectado | "cart" | ☐ |
| action | parse_whatsapp_cart | ☐ |
| RPC flor_parse_whatsapp_cart chamada | ✓ | ☐ |
| catalog_import_batches criado | ✓ | ☐ |
| match_catalog_item_for_agent executado por item | ✓ | ☐ |
| reply confirma recebimento do pedido | ✓ | ☐ |
| requires_human_review | true se item não encontrado | ☐ |

---

## Cenário 18 — Áudio recebido

**Input:** `[mensagem de áudio]`

| Critério | Esperado | Status |
|---|---|---|
| message_type | "audio" | ☐ |
| reply | "Ainda não consigo ouvir áudios, pode digitar?" | ☐ |
| action | ask_info | ☐ |
| Nenhuma tentativa de transcrição (MVP) | ✓ | ☐ |

---

## Cenário 19 — Condolências

**Input:** `"Preciso de uma coroa de flores para velório"`

| Critério | Esperado | Status |
|---|---|---|
| intent.occasion | "luto" ou "condolencias" | ☐ |
| reply tem tom respeitoso | ✓ | ☐ |
| reply SEM emojis excessivos | ✓ | ☐ |
| action | search_catalog (busca coroas) | ☐ |
| search com occasion="luto" | ✓ | ☐ |

---

## Cenário 20 — Informações da loja (FAQ)

**Input:** `"Qual o horário de funcionamento?"` ou `"Qual o endereço?"`

| Critério | Esperado | Status |
|---|---|---|
| action | smalltalk | ☐ |
| reply contém informação da loja (horário/endereço) | ✓ | ☐ |
| Informação NÃO inventada (vem de settings ou prompt) | ✓ | ☐ |

---

## Cenário 21 — Troca de produto durante pedido

**Setup:** Cliente já tem produto selecionado no contexto
**Input:** `"Na verdade, prefiro girassóis ao invés de rosas"`

| Critério | Esperado | Status |
|---|---|---|
| action | search_catalog (novo produto) | ☐ |
| Catálogo busca "girassol" | ✓ | ☐ |
| Dados anteriores preservados | ✓ (nome, data, etc.) | ☐ |

---

## Cenário 22 — Abandono de conversa

**Setup:** Cliente pede orçamento, recebe opções
**Input:** [cliente não responde por 30 minutos]

| Critério | Esperado | Status |
|---|---|---|
| Bot NÃO envia mensagem automática de follow-up (fora do MVP) | ✓ | ☐ |
| Conversa permanece no stage anterior | ✓ | ☐ |
| Na próxima mensagem: contexto preservado | ✓ | ☐ |

---

## Cenário 23 — Reclamação

**Input:** `"Fui mal atendida na última vez que pedi, não voltarei mais"`

| Critério | Esperado | Status |
|---|---|---|
| action | handoff_human | ☐ |
| reply empático, sem justificativas automáticas | ✓ | ☐ |
| handoff.reason | "reclamacao" ou similar | ☐ |

---

## Cenário 24 — Entrega fora da cidade

**Input:** `"Quero entrega em Curitiba"`

| Critério | Esperado | Status |
|---|---|---|
| reply informa limitação geográfica corretamente | ✓ | ☐ |
| NÃO confirma entrega em área não coberta | ✓ | ☐ |
| action | ask_info ou handoff_human | ☐ |

---

## Cenário 25 — Produto indisponível

**Setup:** Catálogo com produto `availability_status = 'out_of_stock'`
**Input:** `"Quero aquele produto específico que está esgotado"`

| Critério | Esperado | Status |
|---|---|---|
| search_catalog retorna availability_status | ✓ | ☐ |
| reply NÃO confirma disponibilidade | ✓ | ☐ |
| reply sugere alternativas disponíveis | ✓ | ☐ |
| action | search_catalog (fallback) ou handoff_human | ☐ |

---

## Checklist geral de qualidade (executar após cada cenário)

- [ ] Nenhum preço ou produto inventado
- [ ] Uma única resposta por mensagem
- [ ] Dados de sessão preservados entre mensagens
- [ ] `conversation_messages` com pares inbound/outbound corretos
- [ ] `agent_events` com action e stage corretos
- [ ] Redis buffer limpo após processamento
- [ ] Redis last_msg_id limpo (expirou ou processado)
- [ ] Sem timeouts de execução no n8n
- [ ] Sem erros 4xx/5xx do Supabase nos logs do n8n
- [ ] Sem erros da Evolution API (verificar resposta)

---

## Log de execuções de teste

| Data | Cenário | Resultado | Observação |
|---|---|---|---|
| | | | |
| | | | |

---

---

## Sprint 6A — Cenários Multimodal e Dia das Mães (15 novos cenários)

### Cenário 26 — Áudio: "quero flores para minha mãe até 150"

**Input:** mensagem de áudio com conteúdo "quero flores para minha mãe até 150"
**message_type:** `audio`

| Critério | Esperado | Status |
|---|---|---|
| IF HAS AUDIO? | true | ☐ |
| HTTP: EVOLUTION GET AUDIO chamado | base64 retornado | ☐ |
| CODE: AUDIO TO BINARY executado | binary data criado | ☐ |
| OPENAI: TRANSCRIBE AUDIO executado | `text` contém transcrição | ☐ |
| CODE: MERGE AUDIO | `message_text` = transcrição | ☐ |
| transcription salvo em exchange | p_transcription preenchido | ☐ |
| action | search_catalog | ☐ |
| search_query | contém "flores" ou "buquê" | ☐ |
| occasion_filter | dia_das_maes | ☐ |
| reply contém produtos | preço ≤ R$ 150 idealmente | ☐ |
| reply contém link /produto/{slug} | ✓ | ☐ |

---

### Cenário 27 — Áudio: download falha → fallback

**Input:** mensagem de áudio onde Evolution retorna erro 404
**Simulação:** desativar instância Evolution temporariamente

| Critério | Esperado | Status |
|---|---|---|
| HTTP: EVOLUTION GET AUDIO continueOnFail | execução continua | ☐ |
| CODE: AUDIO TO BINARY | audio_b64_missing = true | ☐ |
| CODE: MERGE AUDIO | agent_note = AUDIO_DOWNLOAD_FAILED | ☐ |
| agent_reply | pede para digitar a mensagem | ☐ |
| flor_log_media_event chamado (se configurado) | event registrado | ☐ |
| nenhum erro 500 no n8n | ✓ | ☐ |

---

### Cenário 28 — Imagem de referência de buquê

**Input:** foto de um buquê de rosas enviada pelo cliente
**message_type:** `image`

| Critério | Esperado | Status |
|---|---|---|
| IF HAS AUDIO? | false | ☐ |
| IF HAS IMAGE? | true | ☐ |
| CODE: PREP IMAGE extraiu image_url | URL válida ou data URL | ☐ |
| HTTP: OPENAI VISION executado | `choices[0].message.content` descritivo | ☐ |
| CODE: MERGE IMAGE | visual_description preenchida | ☐ |
| is_payment_receipt | false | ☐ |
| agent_note | contém IMAGE_REFERENCE | ☐ |
| action | search_catalog (busca similar) | ☐ |
| reply menciona estilo/cor da imagem | ✓ | ☐ |

---

### Cenário 29 — Imagem de comprovante de pagamento

**Input:** screenshot de comprovante PIX
**message_type:** `image`

| Critério | Esperado | Status |
|---|---|---|
| HTTP: OPENAI VISION | detecta "comprovante" ou "pagamento" | ☐ |
| CODE: MERGE IMAGE | is_payment_receipt = true | ☐ |
| agent_note | contém PAYMENT_RECEIPT | ☐ |
| system prompt inclui [SISTEMA: comprovante] | ✓ | ☐ |
| action | ask_info ou update_order_draft | ☐ |
| reply confirma recebimento | não faz busca de produto | ☐ |

---

### Cenário 30 — Saudação inicial Dia das Mães

**Input:** `"Oi"` (primeira mensagem, sem histórico)

| Critério | Esperado | Status |
|---|---|---|
| is_existing_customer | false | ☐ |
| ctx_stage | new | ☐ |
| system_prompt contém "Dia das Mães" | ✓ | ☐ |
| agent_reply menciona Dia das Mães | "Você gostaria de ver opções para o Dia das Mães?" | ☐ |
| action | ask_info | ☐ |
| agent_stage | identificando_necessidade | ☐ |

---

### Cenário 31 — Dia das Mães com orçamento

**Input:** `"quero um presente para minha mãe, tenho até R$100"`

| Critério | Esperado | Status |
|---|---|---|
| action | search_catalog | ☐ |
| occasion_filter | dia_das_maes | ☐ |
| reply lista opções ≤ R$ 100 | idealmente | ☐ |
| reply contém links /produto/{slug} | ✓ | ☐ |
| nenhum produto inventado | apenas catálogo | ☐ |

---

### Cenário 32 — Fechamento autônomo sem handoff

**Input:** `"pode fechar, quero o buquê de rosas, vou retirar"`

| Critério | Esperado | Status |
|---|---|---|
| action | create_order_draft OU update_order_draft | ☐ |
| NÃO action = handoff_human | ✓ | ☐ |
| fulfillment_type | pickup | ☐ |
| reply confirma pedido criado | public_code gerado | ☐ |
| reply contém link /pedido/{codigo} | ✓ | ☐ |
| conversa NÃO marcada human_takeover | ✓ | ☐ |

---

### Cenário 33 — prepare_checkout: cliente confirma pagamento

**Input:** `"quero pagar no pix"` (após pedido criado)

| Critério | Esperado | Status |
|---|---|---|
| action | prepare_checkout | ☐ |
| checkout_data.payment_method | mercado_pago OU equivalente PIX | ☐ |
| HTTP: PREPARE CHECKOUT chamado | p_order_id preenchido | ☐ |
| flor_prepare_checkout retorna | ok=true, checkout_url preenchido | ☐ |
| checkout_url formato | {CATALOG_BASE_URL}/pedido/{code}/pagamento | ☐ |
| order status no banco | pending_payment | ☐ |
| reply contém link de pagamento | ✓ | ☐ |
| NÃO action = handoff_human | ✓ | ☐ |
| flor_register_agent_exchange | p_agent_action = prepare_checkout | ☐ |

---

### Cenário 34 — Cliente pede link do produto

**Input:** `"manda o link desse"` (após catálogo exibido)

| Critério | Esperado | Status |
|---|---|---|
| action | search_catalog OU ask_info | ☐ |
| reply contém link /produto/{slug} | ✓ | ☐ |
| CATALOG_BASE_URL substituído | não contém "CONFIGURE_HERE" | ☐ |

---

### Cenário 35 — Cliente diz "é retirada"

**Input:** `"vou retirar na loja"`

| Critério | Esperado | Status |
|---|---|---|
| action | update_order_draft (se pedido existe) OU ask_info | ☐ |
| p_fulfillment_type | pickup | ☐ |
| flor_update_order_draft retorna | ok=true | ☐ |
| reply confirma retirada | sem taxa de entrega | ☐ |

---

### Cenário 36 — Entrega para mãe no domingo (Dia das Mães)

**Input:** `"quero entrega no domingo para minha mãe"`

| Critério | Esperado | Status |
|---|---|---|
| action | update_order_draft | ☐ |
| p_fulfillment_type | delivery | ☐ |
| p_desired_date | próximo domingo | ☐ |
| reply confirma entrega com data | ✓ | ☐ |

---

### Cenário 37 — Carrinho WhatsApp nativo

**Input:** mensagem com orderMessage (carrinho nativo WA)
**message_type:** `cart`

| Critério | Esperado | Status |
|---|---|---|
| has_cart detectado | true | ☐ |
| action | parse_whatsapp_cart | ☐ |
| HTTP: PARSE CART chamado | ✓ | ☐ |
| flor_parse_whatsapp_cart retorna | ok=true, items mapeados | ☐ |
| catalog_import_batches criado | source=whatsapp_cart | ☐ |
| reply confirma itens | lista os produtos identificados | ☐ |

---

### Cenário 38 — Duas mensagens rápidas (anti-duplicidade)

**Input:** mensagem 1: `"oi"`, mensagem 2: `"quero buquê"` (< 2s de intervalo)

| Critério | Esperado | Status |
|---|---|---|
| Apenas 1 execução completa até ENVIA EVOLUTION | ✓ | ☐ |
| REDIS: GET LAST MSG ID valida | apenas msg mais recente processa | ☐ |
| Buffer contém ambas as mensagens | buffer_count = 2 | ☐ |
| message_text contém "oi\nquero buquê" | ✓ | ☐ |
| Apenas 1 resposta enviada ao cliente | ✓ | ☐ |

---

### Cenário 39 — Human lock ativo

**Input:** qualquer mensagem com `flor:human_lock:{phone} = 1` no Redis

| Critério | Esperado | Status |
|---|---|---|
| HUMAN TAKEOVER ATIVO? | true = lock existe | ☐ |
| Execução termina no IF falso | ✓ | ☐ |
| Nenhuma resposta do agente enviada | ✓ | ☐ |
| Nenhum novo processamento de IA | ✓ | ☐ |

---

### Cenário 40 — prepare_checkout com pedido não encontrado

**Input:** agente tenta prepare_checkout com order_id inválido

| Critério | Esperado | Status |
|---|---|---|
| flor_prepare_checkout retorna | ok=false, error preenchido | ☐ |
| CODE: MERGE CHECKOUT trata erro | ✓ | ☐ |
| reply não contém link quebrado | mensagem de erro amigável | ☐ |
| NÃO dispara handoff_human automático | ✓ | ☐ |

---

## Comandos úteis para depuração

```bash
# Verificar buffer Redis
redis-cli GET "flor:buffer:5545988230845"

# Verificar human lock
redis-cli GET "flor:human_lock:5545988230845"

# Listar chaves de um cliente
redis-cli KEYS "flor:*:5545988230845"

# Ver últimas conversas no Supabase (via psql ou Dashboard)
SELECT * FROM vw_admin_conversations LIMIT 10;

# Ver últimas mensagens de uma conversa (Sprint 6A — colunas reais)
SELECT direction, sender_type, message_type, body, agent_action, agent_stage, created_at
FROM conversation_messages
WHERE conversation_id = 'uuid-aqui'
ORDER BY created_at DESC LIMIT 20;

# Ver últimos agent_events (Sprint 6A — colunas reais)
SELECT event_type, action, input_json, output_json, error_json, created_at
FROM agent_events
ORDER BY created_at DESC LIMIT 20;

# Ver transcrições de áudio
SELECT id, message_type, body, transcription, created_at
FROM conversation_messages
WHERE message_type = 'audio'
ORDER BY created_at DESC LIMIT 10;

# Ver pedidos draft criados pelo agente
SELECT id, public_code, status, total_amount, fulfillment_type, created_at
FROM orders
WHERE status IN ('draft', 'pending_payment')
ORDER BY created_at DESC LIMIT 10;
```

---

---

## Cenários MVP Ready — 20 Novos Cenários (Workflow MVP Ready)

> Executar após importar e ativar o workflow `FLOR | WhatsApp Inbound Principal | MVP Ready`.
> Estes cenários cobrem os gaps identificados na Sprint 6A.

---

### Cenário M01 — Normalização de telefone robusta

**Setup:** Simular payload Evolution com `remoteJid = "554588230845@s.whatsapp.net"`

| Critério | Esperado | Status |
|---|---|---|
| phone_normalized | `5545988230845` | ☐ |
| NÃO `554588230845` (sem 9 inserido) | ✓ | ☐ |
| should_process | true | ☐ |
| Supabase customer.phone_normalized | `5545988230845` | ☐ |

---

### Cenário M02 — Payload com body wrapper (Evolution via n8n)

**Setup:** Simular payload onde a Evolution entrega `{ body: { data: { key: ..., message: ... } } }`

| Critério | Esperado | Status |
|---|---|---|
| Normalizer extrai `$json.body` corretamente | ✓ | ☐ |
| phone_normalized populado | ✓ | ☐ |
| message_text populado | ✓ | ☐ |
| NÃO `skip: true` por payload vazio | ✓ | ☐ |

---

### Cenário M03 — Redis indisponível (simular falha)

**Setup:** Credencial Redis com host inválido OU desligar Redis temporariamente

| Critério | Esperado | Status |
|---|---|---|
| GET HUMAN LOCK falha com continueOnFail | execução continua | ☐ |
| SET/GET BUFFER falha com continueOnFail | execução continua | ☐ |
| Workflow processa mensagem com texto atual (sem buffer) | ✓ | ☐ |
| Resposta enviada ao cliente | ✓ | ☐ |
| Nenhum erro 500 no n8n | ✓ | ☐ |
| technical_notes contém redis info | ✓ | ☐ |

---

### Cenário M04 — Produto sem imagem

**Input:** `"Quero ver opções de buquê"` (produtos no catálogo sem `cover_image_url`)

| Critério | Esperado | Status |
|---|---|---|
| search_catalog retorna produtos | ✓ | ☐ |
| catalog_items com cover_image_url = null | ✓ | ☐ |
| reply lista produtos com preço e link | ✓ | ☐ |
| reply NÃO quebra sem imagem | ✓ | ☐ |
| NÃO tenta enviar media nula | ✓ | ☐ |

---

### Cenário M05 — Fluxo completo autônomo (Dia das Mães)

**Input (sequência):**
1. `"Oi"`
2. `"quero presente para minha mãe"`
3. `"tenho até R$ 150"`
4. `"pode ser o buquê de rosas"`
5. `"retirada na loja"`
6. `"pode fechar"`
7. `"quero pagar no pix"`

| Critério | Esperado | Status |
|---|---|---|
| Msg 1: action = ask_info, menciona Dia das Mães | ✓ | ☐ |
| Msg 2: action = search_catalog, occasion = dia_das_maes | ✓ | ☐ |
| Msg 3: action = search_catalog, max_budget = 150 | ✓ | ☐ |
| Msg 4: action = create_order_draft, fulfillment = pickup | ✓ | ☐ |
| Msg 5: action = update_order_draft, fulfillment_type = pickup | ✓ | ☐ |
| Msg 6: action = create/update_order, NÃO handoff | ✓ | ☐ |
| Msg 7: action = prepare_checkout, checkout_url gerado | ✓ | ☐ |
| orders.status final | pending_payment | ☐ |
| conversation.human_takeover | false ao longo de todo o fluxo | ☐ |
| 7 trocas registradas em conversation_messages | ✓ | ☐ |

---

### Cenário M06 — Mensagem do cartão coletada pelo agente

**Input:** `"No cartão escreve: Com amor eterno, seu filho"` (após produto escolhido)

| Critério | Esperado | Status |
|---|---|---|
| action | update_order_draft | ☐ |
| p_gift_message | "Com amor eterno, seu filho" | ☐ |
| orders.gift_message no banco | ✓ | ☐ |
| reply confirma mensagem do cartão | ✓ | ☐ |

---

### Cenário M07 — Endereço de entrega informado

**Input:** `"Quero entrega na Rua das Flores 123, Centro, Cascavel"` (pedido draft existente)

| Critério | Esperado | Status |
|---|---|---|
| action | update_order_draft | ☐ |
| p_fulfillment_type | delivery | ☐ |
| p_delivery_address_json populado | ✓ | ☐ |
| shipping_amount recalculado | ✓ | ☐ |
| reply confirma entrega com valor de frete | ✓ | ☐ |

---

### Cenário M08 — Data de entrega para domingo (Dia das Mães)

**Input:** `"quero para domingo dia 11"` (após produto escolhido)

| Critério | Esperado | Status |
|---|---|---|
| action | update_order_draft | ☐ |
| p_desired_date | 2026-05-11 (ou próximo domingo) | ☐ |
| orders.desired_fulfillment_date | ✓ | ☐ |
| reply confirma data | ✓ | ☐ |

---

### Cenário M09 — Áudio transcrito corretamente

**Input:** Mensagem de áudio com `"quero flores para minha mãe, tenho até 100 reais"`

| Critério | Esperado | Status |
|---|---|---|
| message_type | audio | ☐ |
| OPENAI: TRANSCRIBE AUDIO executado | ✓ | ☐ |
| transcription populada | contém "flores" e "mãe" | ☐ |
| action | search_catalog | ☐ |
| max_budget extraído da transcrição | ~100 | ☐ |
| conversation_messages.transcription | ✓ | ☐ |
| flor_log_media_event chamado | ✓ | ☐ |

---

### Cenário M10 — Áudio: download falha (continueOnFail)

**Setup:** Simular falha na Evolution (host inválido temporário) para o endpoint getBase64

| Critério | Esperado | Status |
|---|---|---|
| HTTP: EVOLUTION GET AUDIO continueOnFail | execução continua | ☐ |
| CODE: AUDIO TO BINARY detecta b64 ausente | audio_b64_missing = true | ☐ |
| CODE: MERGE AUDIO retorna fallback | fallback_reply preenchido | ☐ |
| reply pede para digitar mensagem | ✓ | ☐ |
| NÃO trava o workflow | ✓ | ☐ |

---

### Cenário M11 — Imagem de buquê de referência

**Input:** Foto de buquê enviada pelo cliente

| Critério | Esperado | Status |
|---|---|---|
| message_type | image | ☐ |
| HTTP: OPENROUTER VISION executado | ✓ | ☐ |
| visual_description contém [REFERENCIA_FLORAL] | ✓ | ☐ |
| agent_note | IMAGE_REFERENCE | ☐ |
| action | search_catalog (busca similar) | ☐ |
| reply menciona referência visual recebida | ✓ | ☐ |

---

### Cenário M12 — Imagem de comprovante de pagamento

**Input:** Screenshot de comprovante PIX enviado pelo cliente

| Critério | Esperado | Status |
|---|---|---|
| visual_description contém [COMPROVANTE_PAGAMENTO] | ✓ | ☐ |
| is_payment_receipt | true | ☐ |
| agent_note | PAYMENT_RECEIPT | ☐ |
| reply confirma recebimento do comprovante | ✓ | ☐ |
| NÃO faz search_catalog para comprovante | ✓ | ☐ |

---

### Cenário M13 — Duas mensagens em menos de 2s (anti-duplicidade)

**Input:** `"oi"` seguido imediatamente de `"quero buquê"` (< 2s)

| Critério | Esperado | Status |
|---|---|---|
| Apenas 1 execução completa até ENVIA EVOLUTION | ✓ | ☐ |
| buffer_count = 2 | ✓ | ☐ |
| message_text contém ambas as mensagens concatenadas | ✓ | ☐ |
| REDIS: GET LAST MSG ID CHECK valida msg mais recente | ✓ | ☐ |
| Apenas 1 resposta enviada ao cliente | ✓ | ☐ |

---

### Cenário M14 — Carrinho WhatsApp nativo

**Setup:** Payload Evolution com `message.orderMessage` contendo 2 itens

| Critério | Esperado | Status |
|---|---|---|
| effective_message_type | cart | ☐ |
| action | parse_whatsapp_cart | ☐ |
| HTTP: PARSE CART chamado | ✓ | ☐ |
| flor_parse_whatsapp_cart retorna | ok=true, items mapeados | ☐ |
| catalog_import_batches criado | source=whatsapp_cart | ☐ |
| reply confirma itens identificados | ✓ | ☐ |

---

### Cenário M15 — Pedido de atendente humano explícito

**Input:** `"Quero falar com uma pessoa real"`

| Critério | Esperado | Status |
|---|---|---|
| action | handoff_human | ☐ |
| HTTP: TRIGGER HANDOFF chamado | ✓ | ☐ |
| flor_trigger_handoff retorna | ok=true | ☐ |
| conversations.human_takeover | true | ☐ |
| conversations.status | pending (NÃO waiting_human) | ☐ |
| conversations.stage | handoff | ☐ |
| REDIS: SET HUMAN LOCK | TTL 28800 (8h) | ☐ |
| reply empático, menciona atendente | ✓ | ☐ |

---

### Cenário M16 — Saída final normalizada: todas as branches

**Para cada uma das 7 branches do SWITCH ACTION:**

| Branch | Critério | Esperado | Status |
|---|---|---|---|
| search_catalog | CODE: NORMALIZA SAÍDA FINAL executado | ✓ | ☐ |
| create_order_draft | CODE: NORMALIZA SAÍDA FINAL executado | ✓ | ☐ |
| update_order_draft | CODE: NORMALIZA SAÍDA FINAL executado | ✓ | ☐ |
| prepare_checkout | CODE: NORMALIZA SAÍDA FINAL executado | ✓ | ☐ |
| parse_whatsapp_cart | CODE: NORMALIZA SAÍDA FINAL executado | ✓ | ☐ |
| handoff_human | CODE: NORMALIZA SAÍDA FINAL executado | ✓ | ☐ |
| default/passthrough | CODE: NORMALIZA SAÍDA FINAL executado | ✓ | ☐ |

Para cada branch verificar: `agent_reply` não vazio, `phone_normalized` populado, `conversation_id` populado.

---

### Cenário M17 — OpenRouter Chat falha (continueOnFail)

**Setup:** Configurar OPENROUTER_API_KEY inválida temporariamente

| Critério | Esperado | Status |
|---|---|---|
| HTTP: OPENROUTER CHAT continueOnFail | execução continua | ☐ |
| CODE: PARSE & VALIDATE IA JSON detecta resposta vazia | ✓ | ☐ |
| action | ask_info (fallback) | ☐ |
| agent_reply | mensagem de erro amigável | ☐ |
| Evolution envia resposta ao cliente | ✓ (não trava) | ☐ |
| flor_register_agent_exchange chamado | ✓ | ☐ |

---

### Cenário M18 — fromMe e grupo (filtros robustos)

**Input A:** Payload com `key.fromMe = true`
**Input B:** Payload com `remoteJid = "12345678901@g.us"`

| Critério | Esperado A | Esperado B | Status |
|---|---|---|---|
| should_process | false | false | ☐ |
| ignore_reason | fromMe | grupo | ☐ |
| RESPONDE WEBHOOK IGNORADO | ✓ | ✓ | ☐ |
| Nenhuma chamada Supabase | ✓ | ✓ | ☐ |
| Nenhuma chamada Redis de processamento | ✓ | ✓ | ☐ |

---

### Cenário M19 — prepare_checkout com pedido não encontrado / não-draft

**Setup:** `p_order_id` inexistente ou pedido com status `pending_payment` (não draft)

| Critério | Esperado | Status |
|---|---|---|
| flor_prepare_checkout retorna | ok=false, error preenchido | ☐ |
| CODE: FORMAT CHECKOUT trata erro | checkout_ok = false | ☐ |
| CODE: NORMALIZA SAÍDA FINAL não quebra | ✓ | ☐ |
| reply contém mensagem de erro amigável | NÃO contém link quebrado | ☐ |
| NÃO dispara handoff automático por checkout falho | ✓ | ☐ |

---

### Cenário M20 — Registro completo no Supabase (auditoria)

**Input:** `"Oi"` (mensagem simples)

Verificar no Supabase após execução:

| Critério | Esperado | Status |
|---|---|---|
| customers: registro criado/atualizado | phone_normalized correto | ☐ |
| conversations: registro criado/atualizado | stage correto | ☐ |
| conversation_messages: inbound inserido | body = "Oi", direction = inbound | ☐ |
| conversation_messages: outbound inserido | direction = outbound, body = resposta | ☐ |
| agent_events: registro inserido | event_type = agent_exchange | ☐ |
| agent_events: action | ask_info ou smalltalk | ☐ |
| agent_events: input_json | message_type, body_length preenchidos | ☐ |
| agent_events: output_json | action, stage, reply_length preenchidos | ☐ |

---

## Checklist geral MVP Ready (executar após cada cenário)

- [ ] Nenhum preço ou produto inventado
- [ ] Uma única resposta por mensagem
- [ ] Dados de sessão preservados entre mensagens (Redis session)
- [ ] `conversation_messages` com pares inbound/outbound corretos
- [ ] `agent_events` com action e stage corretos (input_json/output_json, NÃO payload_json)
- [ ] Redis buffer limpo após processamento (DEL BUFFER executado)
- [ ] Redis last_msg_id expirou ou processado
- [ ] CODE: NORMALIZA SAÍDA FINAL foi sempre a fonte de agent_reply
- [ ] Redis SET SESSION NÃO foi a fonte de agent_reply
- [ ] Sem timeouts no n8n (verificar execuções)
- [ ] Sem erros 4xx/5xx do Supabase
- [ ] Sem erros da Evolution API (sendText com sucesso)
- [ ] phone_normalized sempre no formato 55DDDDXXXXXXX (13 dígitos)
- [ ] Nenhuma credencial hardcoded nos nodes (usar $vars e credentials)

---

## Log de execuções MVP Ready

| Data | Cenário | Resultado | Observação |
|---|---|---|---|
| | | | |
| | | | |
