# Modelagem Inicial de Dados

## Observação
A modelagem abaixo deve ser replicada por app/empresa em bancos separados.

## Tabelas principais

### admins
- id
- email
- full_name
- password_hash ou referência auth
- is_active
- created_at
- updated_at

### settings
- id
- store_name
- whatsapp_number
- support_email
- pickup_enabled
- delivery_enabled
- logo_url
- brand_theme_json
- checkout_message
- created_at
- updated_at

### banners
- id
- title
- subtitle
- image_url
- cta_label
- cta_href
- is_active
- sort_order
- created_at
- updated_at

### categories
- id
- name
- slug
- description
- image_url
- is_active
- sort_order
- created_at
- updated_at

### products
- id
- category_id
- name
- slug
- short_description
- description
- price
- compare_at_price nullable
- cover_image_url
- is_active
- is_featured
- product_type enum('regular','custom_combo')
- created_at
- updated_at

### product_images
- id
- product_id
- image_url
- alt_text
- sort_order
- created_at

### combo_options
- id
- product_id
- group_name
- option_name
- price_delta
- is_required
- max_select nullable
- sort_order
- created_at
- updated_at

### delivery_fees
- id
- name
- amount
- description nullable
- is_active
- sort_order
- created_at
- updated_at

### customers
- id
- full_name
- phone nullable
- email nullable
- created_at
- updated_at

### orders
- id uuid
- public_code
- customer_id
- status
- fulfillment_type enum('pickup','delivery')
- delivery_fee_id nullable
- delivery_fee_amount
- subtotal_amount
- total_amount
- payment_method enum('mercado_pago','cash_on_delivery','cash_on_pickup')
- payment_status enum('pending','paid','expired','cancelled','refunded_manual')
- customer_note nullable
- gift_message nullable
- admin_note nullable
- estimated_fulfillment_text nullable
- address_snapshot_json nullable
- approved_at nullable
- completed_at nullable
- created_at
- updated_at

### order_items
- id
- order_id
- product_id nullable
- product_name_snapshot
- unit_price_snapshot
- quantity
- line_total
- item_customization_json nullable
- created_at
- updated_at

### payments
- id
- order_id
- provider enum('mercado_pago','manual')
- provider_payment_id nullable
- provider_preference_id nullable
- status
- amount
- raw_payload_json nullable
- expires_at nullable
- paid_at nullable
- created_at
- updated_at

### order_status_history
- id
- order_id
- old_status nullable
- new_status
- changed_by enum('system','admin')
- notes nullable
- created_at

### imports
- id
- file_name
- status
- total_rows
- imported_rows
- failed_rows
- error_report_json nullable
- created_at
- updated_at

## Status de pedido sugeridos
- `draft`
- `pending_payment`
- `paid_pending_review`
- `awaiting_manual_review`
- `approved`
- `in_preparation`
- `ready_for_pickup`
- `out_for_delivery`
- `completed`
- `cancelled`
- `expired`

## Regras importantes
- pedido pago e ainda não aprovado deve continuar em fila de revisão manual;
- snapshots devem ser gravados nos itens do pedido para preservar histórico;
- endereço pode ser armazenado em snapshot JSON no MVP para simplificar;
- combos personalizados devem registrar escolhas em JSON no item do pedido;
- importação XLSX deve gerar relatório de linhas com erro.
