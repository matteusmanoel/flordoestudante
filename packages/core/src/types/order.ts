/**
 * Tipos de pedido, itens e shipping.
 */

import type { OrderStatus } from '../constants/order';
import type { PaymentStatus } from '../constants/payment';
import type { FulfillmentType, PaymentMethod } from '../constants/domain';
import type { AddressSnapshot } from './customer';

export interface OrderItemSnapshot {
  product_id: string | null;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  line_total: number;
  item_customization_json?: Record<string, unknown> | null;
}

export interface OrderItem extends OrderItemSnapshot {
  id: string;
  order_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  public_code: string;
  customer_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_type: FulfillmentType;
  shipping_rule_id: string | null;
  shipping_amount: number;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  customer_note?: string | null;
  gift_message?: string | null;
  admin_note?: string | null;
  estimated_fulfillment_text?: string | null;
  address_snapshot_json?: AddressSnapshot | null;
  pricing_snapshot_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  approved_at?: string | null;
  cancelled_at?: string | null;
  completed_at?: string | null;
  items?: OrderItem[];
}

export interface ShippingRule {
  id: string;
  name: string;
  rule_type: string;
  amount: number;
  description?: string | null;
  is_active: boolean;
  sort_order: number;
  metadata_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
