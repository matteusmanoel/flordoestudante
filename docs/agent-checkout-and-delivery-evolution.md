# Agente Flora — Análise do fluxo de finalização e PRD de evolução

> Documento técnico-funcional disparado pela revisão da conversa real
> registrada em `workflows/_chat 41.txt` (07/05/2026, 16:18 → 16:26) e do
> workflow ativo `workflows/FLOR | WhatsApp Inbound Principal | Sprint 6A
> Multimodal Mothers Day Sales.json`.
>
> Objetivo: documentar o que está acontecendo, por que está acontecendo,
> o impacto comercial, a regra de negócio correta da Flor do Estudante
> (Capitão Leônidas Marques/PR), e propor um PRD de evolução incremental
> que cubra: link único de checkout, fluxo PIX direto via Evolution,
> consulta de endereço por CEP, restrição de área de entrega, redução de
> atrito no fechamento e separação de responsabilidades para o futuro
> workflow de "status do pedido".

---

## 1. Conversa analisada (chat 41)

Trecho-chave do diálogo, com timestamps:

| Hora     | Quem      | Mensagem (resumo)                                                                                     |
|----------|-----------|--------------------------------------------------------------------------------------------------------|
| 16:18:35 | Flora     | Saudação, abre tema Dia das Mães.                                                                      |
| 16:20:05 | Flora     | "Vou te mostrar algumas opções..." (envia 3 produtos: Buquê Vermelhas, Buquê Misto, Cesta Café Manhã). |
| 16:21:10 | Cliente   | **"Vou querer a Cesta. Vocês tem opções de girassóis também?"**                                        |
| 16:21:21 | Flora     | "Já montei o pedido da *Cesta de Café da Manhã*... entrega ou retirada?"                              |
| 16:21:37 | Cliente   | "Seria pra entrega"                                                                                    |
| 16:22:40 | Cliente   | "CEP 85860320, número 493 para Vitória, hoje à tarde"                                                  |
| 16:22:51 | Flora     | "Atualizei a entrega para o CEP 85860-320, número 493, para Vitória, hoje à tarde..."                  |
| 16:23:38 | Flora     | "Atualizei a mensagem do cartão... e confirmei a entrega para hoje à tarde no CEP 85860-320..."        |
| 16:23:50 | Cliente   | "Pode finalizar."                                                                                      |
| 16:24:02 | Flora     | "Seu pedido... será entregue hoje à tarde no CEP 85860-320, número 493, para Vitória..."               |
| 16:26:07 | Cliente   | **"Pode me enviar o link de pagamento."**                                                              |
| 16:26:21 | Flora     | "Vou gerar o link de pagamento..." → resumo + link `/pedido/AACF48EB/pagamento`.                       |

A tela do checkout aberta pelo link mostra apenas:

```
Pedido AACF48EB
Total: R$ 144,90
```

…sem itens, sem botão de Mercado Pago, sem PIX, sem CTA para pagar.
Ou seja: o link **existe**, mas a página de pagamento **não consegue
oferecer pagamento**.

---

## 2. Diagnóstico técnico (root cause)

### 2.1 Ordem é criada, mas pagamento não é

A RPC `flor_prepare_checkout` (`supabase/floricultura/migrations/00025_flor_mvp_agent_rpcs.sql`,
linhas 646-727) faz apenas:

```text
UPDATE orders SET status = 'pending_payment', payment_method = ...
RETURN { ok, public_code, checkout_url, ... }
```

**Não insere nada em `payments`** e **não chama o Mercado Pago**.
A página `/pedido/[codigo]/pagamento` (`features/payments/data-order.ts`)
lê `payments` para popular `mpInitPoint`. Como não existe payment para
esse pedido, `OrderPaymentView.payment = null`, e em
`PedidoPagamentoClient.tsx` os blocos condicionais caem no fallback
silencioso (linha 160 — `isMp && !awaitingOnlinePay && !paid && !expired`).

> **Resultado prático:** o cliente vê "Total: R$ 144,90" e nada mais. Não
> consegue pagar pela web.

### 2.2 `payment_method` fica nulo

No node `HTTP: PREPARE CHECKOUT | S6` o body é:

```json
{
  "p_order_id": "...",
  "p_payment_method": "{{ $json.checkout_data?.payment_method || null }}"
}
```

Como o agente não preenche `checkout_data.payment_method` (o prompt não
exige), o RPC mantém o valor já existente em `orders.payment_method`.
E `flor_create_order_draft` **não preenche** essa coluna no INSERT
(`migrations/00025`, linha 475-491). Resultado: `payment_method = NULL`
ou valor default, o que faz `isMp = false` na página → nem o caminho de
fallback de retry MP é oferecido.

### 2.3 Checkout web duplica o fluxo, mas o pedido do agente não passa por ele

`features/checkout/actions.ts::finalizeCheckout`:

- cria `customer`, `addresses`, `orders` (com `public_code` formato `FD-2026-XXXXXXXX`),
- insere `order_items`,
- cria `payments` row,
- chama `createMercadoPagoPreference()` e grava `mp_init_point` em
  `payments.raw_payload_json`,
- redireciona para `/pedido/{public_code}`.

O agente, em paralelo, cria pedidos com `public_code` de 8 chars hex
(ex.: `AACF48EB`) via `flor_create_order_draft`. **Os dois caminhos não
convergem.** O pedido do agente nunca passa pela criação de
`payments` + MP preference.

### 2.4 Atrito no fechamento (UX/Prompt)

| Problema observado                                                         | Causa no prompt/workflow                                                     |
|----------------------------------------------------------------------------|------------------------------------------------------------------------------|
| Cliente disse "Vou querer a Cesta. **E vocês têm girassóis?**" → agente ignorou a 2ª frase. | `CODE: DETECTA ESCOLHA DE PRODUTO` cria draft imediatamente quando vê verbo de compra + produto, sem checar perguntas pendentes na mesma mensagem. |
| Endereço repetido 4x no diálogo (16:22:51, 16:23:38, 16:24:02, 16:26:21).  | Prompt não tem regra "confirme endereço só uma vez"; cada turno o LLM repete dados consolidados. |
| Cliente disse "Pode finalizar" às 16:23:50, mas link só veio às 16:26:21 (após 2º pedido explícito). | Prompt diz "Use `prepare_checkout` quando cliente disser pagar/fechar/link/PIX/cartão", mas "finalizar" não está na lista de gatilhos no prompt nem em `CODE: DETECTA ESCOLHA DE PRODUTO`. |
| Nenhuma validação se a entrega é em Capitão Leônidas Marques.              | Workflow não consulta CEP nem rejeita endereços fora da cidade. CEP `85860-320` é de **Cascavel/PR**, não da cidade da loja. |
| Nenhum cálculo dinâmico de frete (R$ 15 fixo do seed).                     | `shipping_rules` tem 1 linha com `amount = 15.00`. Regra correta de negócio é R$ 20 fixo dentro da cidade. |
| Nenhum envio paralelo de PIX para o cliente fechar direto pelo WhatsApp.   | Workflow só envia o link `/pedido/.../pagamento`. Evolution suporta `sendPix`/QR copia-e-cola, mas não está cabeado. |
| Comprovante enviado pelo cliente não tem fluxo de confirmação humana.      | `CODE: MERGE IMAGE` detecta `is_payment_receipt`, mas após isso o agente apenas "acusa recebimento" sem disparar handoff nem criar evento `payment_confirmation_pending`. |

### 2.5 CEP enviado pelo cliente

`85860-320` → Cascavel/PR (consulta ViaCEP). A loja fica em
**Capitão Leônidas Marques/PR**, faixa de CEP `85790-xxx`. O agente
deveria ter recusado a entrega cordialmente e oferecido retirada ou
intermediação humana.

---

## 3. Regras de negócio confirmadas

### 3.1 Loja física

- **Endereço:** R. Demétrio Paulo Paini, 167 — Capitão Leônidas Marques, PR.
- **CEP:** 85790-000.
- **Cidade IBGE:** 4104303 (Capitão Leônidas Marques).
- **UF:** PR.

### 3.2 Entrega (MVP)

- Entregas permitidas **somente** no município de Capitão Leônidas Marques.
- Taxa **fixa** de **R$ 20,00**, independentemente de bairro (por enquanto).
- Estrutura `shipping_rules` deve permitir, no futuro, taxa por bairro
  sem refazer schema.

### 3.3 Retirada

- Disponível na loja, R. Demétrio Paulo Paini, 167.
- Sem taxa.
- Cliente pode informar quem irá retirar (caso seja outra pessoa).

### 3.4 Pagamento

- Mercado Pago (PIX + cartão via Checkout Pro) — link `/pedido/{code}/pagamento`.
- PIX direto via Evolution (chave PIX da loja) — para cliente que prefira
  pagar dentro do WhatsApp e enviar comprovante.
- Pagar na entrega/retirada — sem link.
- **Reembolso manual** no MVP, sem fluxo automático.

### 3.5 Aprovação

- Pedido pago **não** vira "aprovado" automaticamente.
- Após pagamento (online ou comprovante PIX), pedido fica em
  `awaiting_approval` e aguarda revisão da loja.

---

## 4. Direção arquitetural

### 4.1 Princípio

> **A página `/pedido/{public_code}/pagamento` é a única fonte da verdade
> de checkout do agente.** O agente envia para lá. O agente _também_ pode
> mandar PIX por WhatsApp como atalho, mas o fluxo formal acontece na
> página.

Isso garante:

- consistência entre pedidos web e WhatsApp,
- reaproveitamento do componente `PedidoPagamentoClient`,
- rastreabilidade via `payments` (uma única tabela com toda a história).

### 4.2 Convergência entre os caminhos

| Etapa                              | Web (`finalizeCheckout`)         | Agente (atual)                  | Agente (proposto)                                                         |
|------------------------------------|----------------------------------|---------------------------------|---------------------------------------------------------------------------|
| Cria `customers`                   | sim (upsert por phone/email)     | sim (via `flor_register_agent_exchange`) | manter                                                                  |
| Cria `orders`                      | sim, public_code `FD-YYYY-XXXX`  | sim, public_code 8 hex          | manter formatos distintos, mas aplicar prefixo `WA-` no agente para diferenciação operacional. |
| Cria `order_items`                 | sim                              | sim                             | manter                                                                  |
| Cria `addresses`                   | sim                              | parcial (apenas no `address_snapshot_json`) | criar registro completo em `addresses` quando for entrega validada     |
| Define `payment_method`            | obrigatório no schema do form    | nulo                            | sempre `mercado_pago` por padrão (override quando cliente pedir "pagar na entrega") |
| Cria `payments`                    | sim                              | **NÃO**                         | **criar via `flor_prepare_checkout` v2 ou em fallback no Next.js**       |
| Cria preferência Mercado Pago      | sim                              | **NÃO**                         | gerar via Server Action ou fallback `retryMercadoPagoPreference`         |
| Envia link ao cliente              | redirect web                     | mensagem WhatsApp               | manter                                                                  |
| (Novo) envia PIX via Evolution     | n/a                              | n/a                             | adicionar etapa após `prepare_checkout`                                  |

### 4.3 Onde criar `payments` + preferência MP do agente

**Opção A — RPC `flor_prepare_checkout v2`:** estende a função para
inserir em `payments` e devolver um `payment_id`. O Next.js continua
sendo responsável por chamar o Mercado Pago (porque o token mora no
servidor Vercel). O agente só dispara um "ping" para um endpoint do
app que cria a preferência.

**Opção B (recomendada) — Server Action / API Route `POST /api/agent/prepare-payment`:**
- recebe `{ public_code, payment_method, payer_email? }`,
- valida assinatura/segredo do n8n,
- chama internamente o mesmo fluxo de `finalizeCheckout` (porção de
  pagamento), reaproveitando `createMercadoPagoPreference()`,
- retorna `{ checkout_url, mp_init_point, pix_qr_code, pix_qr_base64,
  pix_copy_paste }`.

Vantagens da B:
- mantém token Mercado Pago só no app,
- evita duplicar lógica em SQL,
- permite gerar **PIX in-message** (ver §5.3) na mesma chamada.

### 4.4 Chave PIX vs Mercado Pago PIX

Mercado Pago já oferece pagamento por PIX dentro do Checkout Pro
(`/v1/payments` com `payment_method_id: 'pix'`). Para mandar PIX
"copia e cola" diretamente no WhatsApp existem duas alternativas:

1. **PIX estático da loja** (chave fixa, ex.: CNPJ): rápido, simples,
   exige conferência manual de comprovante. **Recomendado para MVP.**
2. **PIX dinâmico via API Mercado Pago**: gera `qr_code_base64`,
   `qr_code` (copia e cola) e webhook automático. **Recomendado para
   evolução pós-MVP.**

Para o MVP, vamos com **chave PIX estática** (configurada em `settings`)
e seguir capturando o comprovante via imagem (já existe a detecção em
`CODE: MERGE IMAGE`). Quando o cliente enviar comprovante, o agente
acusa recebimento, marca o pedido como `payment_proof_received` (novo
estágio interno) e dispara handoff para a loja confirmar.

---

## 5. PRD — Evolução do agente Flora e do checkout WhatsApp

### 5.1 Objetivos

| ID  | Objetivo                                                                                                       | KPI                                          |
|-----|----------------------------------------------------------------------------------------------------------------|----------------------------------------------|
| O1  | Permitir que 100% dos pedidos criados via WhatsApp tenham link de pagamento funcional na 1ª tentativa.         | % pedidos `pending_payment` com `payments.mp_init_point` ≠ null. |
| O2  | Reduzir o tempo entre "Pode finalizar" do cliente e o link gerado pelo agente para ≤ 10 s.                     | mediana do delta `finalizar→link`.           |
| O3  | Eliminar entrega aceita fora de Capitão Leônidas Marques.                                                      | 0 ocorrências de `orders.fulfillment_type='delivery'` com cidade ≠ Capitão Leônidas Marques. |
| O4  | Oferecer pagamento via PIX direto no WhatsApp em paralelo ao link MP.                                          | % pedidos com mensagem PIX enviada após `prepare_checkout`. |
| O5  | Reduzir a quantidade de mensagens redundantes do agente (repetição de endereço/itens).                          | Análise qualitativa do log de conversas.     |
| O6  | Capturar interesse adicional do cliente antes de fechar o pedido (ex.: "tem girassóis também?").                | Taxa de upsell aceito por conversa.          |

### 5.2 Escopo do MVP (esta sprint)

#### 5.2.1 Página `/pedido/{code}/pagamento` — robustez

**[F1]** Caso `payments` não exista ou `mp_init_point` esteja vazio,
oferecer **automaticamente** o botão "Gerar link de pagamento" ao
carregar a página, sem depender de `awaitingOnlinePay`.

- Fonte: `apps/floricultura-web/app/(public)/pedido/[codigo]/pagamento/PedidoPagamentoClient.tsx`
- Ajuste: detectar `payment === null` e tratar como `awaitingOnlinePay`
  desde que `status === 'pending_payment'`, chamando
  `retryMercadoPagoPreference()` via efeito inicial ou exibindo o botão
  manual.

**[F2]** Garantir que `retryMercadoPagoPreference` funciona sem
`payments` row prévio: criar `payments` se não existir, depois criar a
preferência. Atualizar `apps/floricultura-web/features/payments/retry-preference-action.ts`.

**[F3]** Exibir lista de itens, endereço, mensagem do cartão,
fulfillment_type e prazo na página de pagamento (hoje só mostra
`Total`). Usar `PedidoPublicPage` (`/pedido/[codigo]/page.tsx`) como
referência: já tem `OrderItemsList`, `OrderProgressBar`, etc.

#### 5.2.2 Endpoint do agente

**[F4]** Criar `POST /api/agent/prepare-payment`:

```ts
// req body
{
  public_code: string;
  payment_method?: 'mercado_pago' | 'pay_on_delivery' | 'pay_on_pickup';
  payer_email?: string;
  payer_phone: string;
  agent_secret: string; // header x-agent-secret
}

// resposta de sucesso
{
  ok: true,
  public_code: string,
  payment_method: 'mercado_pago',
  checkout_url: string,
  mp_init_point: string | null,
  pix?: {
    key: string,
    key_type: 'cnpj'|'phone'|'random',
    instructions: string,
    qr_image_base64?: string // futuro: dinâmico
  }
}
```

Implementação reaproveita o miolo de `finalizeCheckout` para a parte de
pagamento. Token MP fica só no servidor.

**[F5]** O workflow Sprint 6A passa a, no node `HTTP: PREPARE CHECKOUT |
S6`, **apontar para esse novo endpoint** em vez do RPC, OU manter o RPC
e adicionar **um segundo node** após ele que chama o endpoint novo
para criar `payments` + preferência.

> Recomendação: manter RPC para mover `orders.status` para
> `pending_payment` (regra de domínio) **e** chamar o endpoint Next
> em sequência para criar `payments` + MP preference.

#### 5.2.3 PIX direto via Evolution

**[F6]** Após `prepare_checkout`, o workflow envia uma 2ª mensagem
contendo:

```
💚 *Pagamento via PIX (mais rápido):*
Chave PIX: XX.XXX.XXX/0001-XX
Nome: Flor do Estudante LTDA
Valor: R$ 144,90

Após o pagamento, envie o comprovante por aqui que confirmamos seu
pedido. 🌸
```

A chave PIX vive em `settings`:

```sql
INSERT INTO settings (singleton_id, ..., extra_metadata)
VALUES ('main', ..., '{"pix":{"key":"...","key_type":"cnpj","holder":"Flor do Estudante"}}'::jsonb);
```

> Avaliar: usar tabela `settings` existente; se `extra_metadata` não
> existir, adicionar via migration `00026`.

A mensagem usa `POST /message/sendText/{instance}` (já em uso) — não
há necessidade de `sendPix` da Evolution para o MVP (sendPix exige
infra de PSP no servidor Evolution; mais complexo). Quando evoluirmos
para PIX dinâmico (Mercado Pago), trocamos por `sendMedia` (QR Code
PNG) + texto com copia-e-cola.

**[F7]** Quando o cliente enviar imagem detectada como comprovante
(`is_payment_receipt: true` no `CODE: MERGE IMAGE`):

1. acusa recebimento ("Recebi o comprovante, vou confirmar com a equipe e te aviso por aqui."),
2. registra `agent_events.event_type = 'payment_proof_received'` com a URL/base64 da imagem,
3. dispara `flor_trigger_handoff` com `reason='payment_proof_review'`,
4. notifica admin via canal interno (futuro: webhook → Slack/email; MVP: `vw_admin_conversations`).

#### 5.2.4 Endereço, CEP e área de entrega

**[F8]** Novo node `HTTP: VIACEP LOOKUP | S6` (ou função utilitária no
backend) chamada quando o agente identifica `intent='inform_delivery_address'`:

- entrada: `cep`, `numero`,
- saída: `{logradouro, bairro, cidade, uf, ibge}`.

**[F9]** Validação de área:

- Se `cidade !== 'Capitão Leônidas Marques' || uf !== 'PR'`:
  - agente responde com cordialidade explicando a restrição,
  - oferece retirada na loja (R. Demétrio Paulo Paini, 167) como alternativa,
  - **não** atualiza `orders.fulfillment_type='delivery'`.
- Se ok: monta endereço completo e envia **uma única vez** para confirmação:

```
Confirma a entrega para:
🏠 Rua Tal, 493 — Bairro, Capitão Leônidas Marques/PR (CEP 85790-XXX)?
```

Em caso de "sim", grava em `addresses` + `orders.address_snapshot_json`
e **não pergunta endereço novamente** (regra explícita no prompt).

**[F10]** `shipping_rules` recebe migration:

```sql
UPDATE shipping_rules
   SET amount = 20.00,
       description = 'Entrega em Capitão Leônidas Marques (taxa fixa)',
       metadata_json = jsonb_build_object(
         'allowed_cities', jsonb_build_array('Capitão Leônidas Marques'),
         'allowed_uf', 'PR',
         'allowed_ibge_code', '4104303'
       )
 WHERE rule_type = 'fixed' AND is_active = true;
```

`flor_create_order_draft` e `flor_update_order_draft` lêem `amount`
direto da regra ativa (já fazem isso via `SELECT amount FROM shipping_rules`).

Backend Next.js (`features/checkout/data.ts::getActiveShippingRule`) e
o componente `CheckoutAddressSection` passam a respeitar
`metadata_json.allowed_cities` ao validar CEP no formulário web também
(consistência entre canais).

#### 5.2.5 Prompt da Flora — ajustes obrigatórios

**[F11]** Atualizar `CODE: PREPARA PROMPT | S6` (`SYSTEM_PROMPT`) com:

1. **Regra anti-atropelamento**: ao detectar verbo de compra +
   pergunta sobre outro produto na mesma mensagem ("vou querer X. Vocês
   têm Y?"), **primeiro responder a pergunta sobre Y** (via
   `search_catalog` ou explicação se Y não existir), **depois**
   confirmar a escolha de X. Nunca pular para "entrega ou retirada"
   antes de fechar perguntas pendentes.

2. **Regra de fechamento por palavra**: tratar como `prepare_checkout`
   qualquer um destes termos: `finalizar`, `fechar`, `pagar`,
   `pagamento`, `link`, `pix`, `checkout`, `confirmar`, `confirma o pedido`.
   Atualizar `CODE: DETECTA ESCOLHA DE PRODUTO | S6` para também
   capturar essas palavras e definir `agent_action = 'prepare_checkout'`
   diretamente quando houver pedido em montagem completo.

3. **Regra de não-repetição**: depois que o cliente confirmar entrega +
   endereço + mensagem do cartão, o agente **não deve repetir** esses
   dados a cada turno. Resumo apenas no fechamento (junto com o link).

4. **Regra de área de entrega**: instrução explícita sobre Capitão
   Leônidas Marques. Se o CEP/cidade for fora, oferecer retirada e
   **não** prosseguir com fluxo de delivery.

5. **Regra de PIX**: ao gerar `prepare_checkout`, mencionar que tanto
   link MP quanto PIX direto serão enviados.

#### 5.2.6 Detalhe do `agent_messages`

**[F12]** Hoje a 2ª mensagem (PIX) precisa ser enviada **fora** do
fluxo `agent_messages` normal (que sai por `ENVIA RESPOSTA EVOLUTION |
S6`). Solução: após o node `CODE: MERGE CHECKOUT | S6`, encadear:

```
CODE: MERGE CHECKOUT | S6
   ├── CODE: NORMALIZA SAÍDA FINAL | S6 (link MP) ── ENVIA RESPOSTA EVOLUTION
   └── CODE: PREPARA PIX | S6 ── HTTP: EVOLUTION SEND PIX TEXT | S6
```

Sequência: primeiro a mensagem com o link MP (via `ENVIA RESPOSTA
EVOLUTION`), depois a mensagem PIX (após delay configurável de ~1.2s
para não embolar).

### 5.3 Escopo da próxima sprint (workflow de status — fora deste documento)

> Será detalhado em outro PRD. Aqui apenas para alinhar fronteiras.

**Workflow novo `FLOR | Pedido Status Outbound`**:

- triggers: webhook MP, webhook do admin (mudou status), cron periódico.
- responsabilidades:
  - escutar `payments.status = 'paid'` → enviar mensagem ao cliente
    "Pagamento confirmado! Vamos preparar seu pedido com carinho 🌸".
  - escutar mudanças de `orders.status` (`approved`, `in_production`,
    `out_for_delivery`, `ready_for_pickup`, `completed`) → enviar
    atualização correspondente.
  - **não** disputar contexto com o agente principal: usar uma fila
    Redis `flor:outbound:{phone}` ou tabela `outbound_messages` com
    `status='queued'`.

Esse outro workflow consultará as mesmas tabelas (`orders`, `payments`,
`conversations`) sem precisar alterar o agente atual.

### 5.4 Escopo explicitamente fora do MVP

- PIX dinâmico via Mercado Pago (gerar QR + copia/cola por chamada à
  API MP).
- Captura automática (OCR) do comprovante PIX para confirmação sem
  intervenção humana.
- Múltiplas regras de frete por bairro (estrutura `metadata_json` já
  prepara, mas UI/lógica fica para depois).
- Roteirização e tracking real de entregador.
- Reembolso automatizado.

---

## 6. Plano de execução incremental

> Cada milestone é fechado, deployável e testável de forma isolada.

### M1 — Página de pagamento robusta + endpoint do agente (1 dia)

- [ ] **M1.1** Criar `POST /api/agent/prepare-payment` com validação por
  `x-agent-secret`.
- [ ] **M1.2** Refatorar miolo de `finalizeCheckout` extraindo função
  `createPaymentForOrder(orderId)` reaproveitada por web e endpoint.
- [ ] **M1.3** Adaptar `PedidoPagamentoClient.tsx` para tratar
  `payment === null` como `awaitingOnlinePay` quando `status =
  'pending_payment'`.
- [ ] **M1.4** Atualizar `retryMercadoPagoPreference` para criar
  `payments` row se não existir.
- [ ] **M1.5** Tornar a página de pagamento "rica" (itens, endereço,
  mensagem do cartão) — reaproveitar componentes da página `/pedido/[codigo]`.
- [ ] **M1.6** Testes manuais: fluxo agente cria pedido → cliente abre
  link → vê pedido completo + botão MP → paga → webhook MP volta.

### M2 — Workflow Sprint 6A: cabeamento do endpoint + PIX direto (1 dia)

- [ ] **M2.1** Adicionar node `HTTP: AGENT PREPARE PAYMENT | S6` após
  `HTTP: PREPARE CHECKOUT | S6` que chama o endpoint do M1.
- [ ] **M2.2** No `CODE: MERGE CHECKOUT | S6`, montar `agent_messages[]`
  com 2 entradas:
  1. resumo do pedido + link MP,
  2. dados PIX (chave + valor + instrução).
- [ ] **M2.3** Atualizar `CODE: EXPLODE MENSAGENS WHATSAPP | S6` para
  permitir até 4 mensagens neste caso específico (hoje limita a 3).
- [ ] **M2.4** Garantir que a chave PIX vem de `settings.extra_metadata.pix`
  (criar migration `00026_settings_pix.sql` se necessário).
- [ ] **M2.5** Atualizar `CODE: DETECTA ESCOLHA DE PRODUTO | S6` para
  capturar `finalizar/fechar/confirmar` e marcar
  `agent_action='prepare_checkout'` direto.

### M3 — CEP, área de entrega e taxa correta (1 dia)

- [ ] **M3.1** Migration `00026_shipping_capitao_leonidas.sql`:
  `UPDATE shipping_rules SET amount=20, metadata_json=...`.
- [ ] **M3.2** Node `HTTP: VIACEP LOOKUP | S6` que chama
  `https://viacep.com.br/ws/{cep}/json/` antes de
  `update_order_draft`.
- [ ] **M3.3** Validador `CODE: VALIDA AREA ENTREGA | S6` que rejeita
  cidades ≠ Capitão Leônidas Marques.
- [ ] **M3.4** No checkout web: `CheckoutAddressSection` consome
  `shipping_rules.metadata_json.allowed_cities` e bloqueia entrega fora
  da cidade (mostrar mensagem clara e mudar para retirada).
- [ ] **M3.5** Atualizar prompt em `CODE: PREPARA PROMPT | S6` com
  regras F11 (1 a 4).

### M4 — Anti-repetição e UX da Flora (0.5 dia)

- [ ] **M4.1** Atualizar `SYSTEM_PROMPT` (regra F11.3) com instrução
  explícita de não repetir endereço/itens já confirmados.
- [ ] **M4.2** Adicionar no `USER_CONTEXT` flag
  `address_already_confirmed: true|false` para o LLM se orientar.
- [ ] **M4.3** Adicionar regra anti-atropelamento (F11.1): tratar
  perguntas adicionais antes de pedir entrega/retirada.

### M5 — Comprovante PIX e handoff (0.5 dia)

- [ ] **M5.1** Quando `is_payment_receipt = true`, em vez de só "acusar
  recebimento", dispara `flor_trigger_handoff` com
  `reason='payment_proof_review'`.
- [ ] **M5.2** Registra `agent_events` com a URL da imagem e
  `output_json.requires_human_confirmation = true`.
- [ ] **M5.3** Painel admin (próxima iteração) lista esses eventos
  destacados.

### M6 — Documentação e testes (0.5 dia)

- [ ] **M6.1** Atualizar `docs/agent-test-matrix.md` com:
  - cenário "cliente faz pergunta paralela à compra",
  - cenário "endereço fora da cidade",
  - cenário "cliente paga via PIX e envia comprovante",
  - cenário "cliente diz 'finalizar' direto".
- [ ] **M6.2** Atualizar `docs/progress.md` com changelog M1-M5.
- [ ] **M6.3** Smoke test manual em produção (sandbox MP).

---

## 7. Modelagem mínima (mudanças propostas)

### 7.1 `settings` — chave PIX

```sql
-- migration 00026 (futura)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS extra_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE settings
   SET extra_metadata = extra_metadata || jsonb_build_object(
         'pix', jsonb_build_object(
           'key', 'CHAVE_PIX_PROD',
           'key_type', 'cnpj',
           'holder_name', 'Flor do Estudante LTDA'
         )
       )
 WHERE singleton_id = 'main';
```

### 7.2 `shipping_rules` — área permitida

```sql
UPDATE shipping_rules
   SET amount = 20.00,
       description = 'Entrega em Capitão Leônidas Marques — taxa fixa',
       metadata_json = jsonb_build_object(
         'allowed_cities', jsonb_build_array('Capitão Leônidas Marques'),
         'allowed_uf', 'PR',
         'allowed_ibge_code', '4104303',
         'cep_prefix', '85790'
       )
 WHERE is_active = true;
```

### 7.3 `agent_events` — novo `event_type`

Sem alteração de schema; apenas convencionar:

- `payment_proof_received`
- `delivery_area_rejected`
- `multi_intent_detected`

### 7.4 `payments` — fluxo do agente

Sem alteração estrutural. O endpoint `/api/agent/prepare-payment` insere
`payments` com `provider='mercado_pago'`, `status='pending'`,
`expires_at = now() + 24h`, `raw_payload_json={ mp_preference_id,
mp_init_point }`.

---

## 8. Riscos & mitigações

| Risco                                                                            | Probabilidade | Impacto | Mitigação                                                                 |
|----------------------------------------------------------------------------------|---------------|---------|----------------------------------------------------------------------------|
| Endpoint `/api/agent/prepare-payment` exposto sem segredo → criação maliciosa.   | média         | alto    | header `x-agent-secret` + bind de IP do n8n (Cloudfy) na Vercel WAF.       |
| Cliente enviar comprovante adulterado.                                           | baixa         | médio   | handoff humano sempre exigido para confirmar PIX manual.                   |
| Mercado Pago em sandbox, mas chave PIX em produção → cliente paga no PIX em test.| média         | alto    | desabilitar mensagem PIX quando `isMercadoPagoSandbox()` retornar true.    |
| ViaCEP fora do ar.                                                                | baixa         | baixo   | fallback: pedir cidade explícita ao cliente; agente rejeita se não souber. |
| Cliente em cidade limítrofe quer entrega (ex.: Capanema, Realeza).                | baixa         | médio   | exceção tratada por handoff humano; admin pode aprovar manualmente.        |
| Latência ao chamar 2 endpoints (RPC + Vercel) duplica tempo de resposta.         | média         | baixo   | aceitar; ainda fica < 5s. Futuro: mover RPC para dentro do endpoint.       |

---

## 9. Aceite (quando o MVP estiver pronto)

- [ ] Conversa idêntica à do chat 41 produz, em ≤ 10s após "finalizar":
  1. mensagem com resumo + link `/pedido/{code}/pagamento` válido,
  2. mensagem PIX com chave e instrução,
  3. página de pagamento exibe itens, endereço e botão MP funcional.
- [ ] Cliente clica no link → tela mostra pedido detalhado + botão MP →
  consegue pagar PIX/cartão sem retry manual.
- [ ] Webhook MP → `orders.status = 'paid' → 'awaiting_approval'`,
  e mensagem outbound (workflow futuro) avisa cliente.
- [ ] Tentativa de entrega em CEP fora de Capitão Leônidas Marques é
  rejeitada cordialmente; pedido fica como retirada ou não cria draft.
- [ ] Frete = R$ 20,00 em qualquer pedido com entrega na cidade.
- [ ] Conversa onde cliente faz pergunta paralela (ex.: "vou querer X.
  Tem Y?") faz o agente responder Y antes de pedir entrega/retirada.
- [ ] Endereço é confirmado **uma vez** e não repetido nas mensagens
  seguintes.
- [ ] `agent_events` registra `payment_proof_received` quando cliente
  envia comprovante; conversa entra em `human_takeover`.

---

## 10. Anexos rápidos

### A. Estrutura proposta para `agent_messages` no fechamento

```json
{
  "agent_action": "prepare_checkout",
  "agent_stage": "finalizando_pagamento",
  "agent_messages": [
    "Perfeito! Aqui está o resumo do seu pedido 🌸\n\n📋 *Pedido AACF48EB*\n• Cesta de Café da Manhã x1 = R$ 129,90\n\nSubtotal: R$ 129,90\nEntrega: R$ 20,00\n*Total: R$ 149,90*\n🚗 Entrega — Capitão Leônidas Marques",
    "💳 *Pagar via Mercado Pago (PIX ou cartão):*\nhttps://flordoestudante.vercel.app/pedido/AACF48EB/pagamento",
    "💚 *Ou pague direto por PIX:*\nChave (CNPJ): XX.XXX.XXX/0001-XX\nNome: Flor do Estudante LTDA\nValor: R$ 149,90\n\nApós o pagamento, é só me enviar o comprovante por aqui que confirmamos seu pedido. 🌸"
  ]
}
```

### B. CEP de Capitão Leônidas Marques/PR

- Faixa principal: `85790-000` a `85790-999`.
- IBGE: `4104303`.
- ViaCEP retorna `localidade: "Capitão Leônidas Marques"`.

### C. Endpoint `/api/agent/prepare-payment` — esqueleto

```ts
// apps/floricultura-web/app/api/agent/prepare-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createMercadoPagoPreference } from '@/lib/mercado-pago/create-preference';
import { getMercadoPagoAccessToken } from '@/lib/mercado-pago/config';
import { getPublicSiteUrl } from '@/lib/site-url';
import { PAYMENT_STATUS, PAYMENT_METHOD } from '@flordoestudante/core';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-agent-secret');
  if (secret !== process.env.AGENT_SHARED_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { public_code, payment_method = 'mercado_pago', payer_email, payer_phone } = body;

  const supabase = createServerSupabaseClient();
  const { data: order } = await supabase
    .from('orders')
    .select('id, public_code, total_amount, status, payment_method')
    .eq('public_code', public_code)
    .maybeSingle();

  if (!order) return NextResponse.json({ ok: false, error: 'order_not_found' }, { status: 404 });

  // ... cria payments, chama MP, retorna init_point + dados PIX ...
}
```

---

**Última atualização:** 07/05/2026 — após análise da conversa 41 e do
workflow Sprint 6A. Próxima revisão prevista: ao final do M2.
