'use server';

/**
 * Finalização do checkout: pedido + pagamento (Mercado Pago ou manual/offline).
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  FULFILLMENT_TYPE,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from '@flordoestudante/core';

import { getMercadoPagoAccessToken } from '@/lib/mercado-pago/config';
import { createMpPaymentForOrder } from '@/features/payments/create-payment';
// MVP produção: checkout one-shot apenas Mercado Pago / offline — Stripe desativado.
// import { createOneTimeCheckout } from '@/lib/stripe/create-checkout';
// import { getStripeSecretKey } from '@/lib/stripe/config';
import type {
  CreateOrderInput,
  FinalizeCheckoutResponse,
  AddressSnapshotPayload,
} from './types';

function generatePublicCode(): string {
  const year = new Date().getFullYear();
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `FD-${year}-${suffix}`;
}

function toAddressSnapshot(
  formAddress: NonNullable<CreateOrderInput['form']['address']>
): AddressSnapshotPayload {
  return {
    recipient_name: formAddress.recipient_name,
    phone: formAddress.phone,
    street: formAddress.street,
    number: formAddress.number,
    complement: formAddress.complement ?? null,
    neighborhood: formAddress.neighborhood,
    city: formAddress.city,
    state: formAddress.state,
    postal_code: formAddress.postal_code,
    reference: formAddress.reference ?? null,
  };
}

function validatePaymentMethod(form: CreateOrderInput['form']): string | null {
  if (form.payment_method === PAYMENT_METHOD.PAY_ON_DELIVERY) {
    if (form.fulfillment_type !== FULFILLMENT_TYPE.DELIVERY) {
      return 'Pagar na entrega exige entrega.';
    }
  }
  if (form.payment_method === PAYMENT_METHOD.PAY_ON_PICKUP) {
    if (form.fulfillment_type !== FULFILLMENT_TYPE.PICKUP) {
      return 'Pagar na retirada exige retirada na loja.';
    }
  }
  return null;
}

export async function finalizeCheckout(input: CreateOrderInput): Promise<FinalizeCheckoutResponse> {
  const { form, cart, shippingAmount, shippingRuleId } = input;

  const pmErr = validatePaymentMethod(form);
  if (pmErr) {
    return { success: false, code: 'PAYMENT_METHOD', message: pmErr };
  }

  if (!cart.items.length || cart.subtotal <= 0) {
    return { success: false, code: 'EMPTY_CART', message: 'Carrinho vazio ou inválido.' };
  }

  if (form.fulfillment_type === FULFILLMENT_TYPE.DELIVERY) {
    if (!form.address) {
      return { success: false, code: 'VALIDATION', message: 'Endereço é obrigatório para entrega.' };
    }
    if (!shippingRuleId || shippingAmount < 0) {
      return {
        success: false,
        code: 'SHIPPING_RULE',
        message: 'Taxa de entrega não disponível. Tente retirada.',
      };
    }
  }

  const phone = form.phone?.trim() || null;
  const email = form.email?.trim() || null;
  if (!phone && !email) {
    return { success: false, code: 'VALIDATION', message: 'Informe telefone ou e-mail.' };
  }

  if (form.payment_method === PAYMENT_METHOD.MERCADO_PAGO && !getMercadoPagoAccessToken()) {
    return {
      success: false,
      code: 'MERCADO_PAGO_CONFIG',
      message: 'Pagamento online indisponível no momento. Escolha pagar na entrega ou na retirada.',
    };
  }

  if (form.payment_method === PAYMENT_METHOD.STRIPE) {
    return {
      success: false,
      code: 'STRIPE_CONFIG',
      message:
        'Pagamento via Stripe está desativado no momento. Use Mercado Pago ou pague na entrega/retirada.',
    };
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return { success: false, code: 'PERSISTENCE', message: 'Configuração do servidor indisponível.' };
  }

  try {
    let customerId: string;

    const existingByEmail = email
      ? await supabase.from('customers').select('id').eq('email', email).maybeSingle()
      : { data: null };
    const existingByPhone = phone
      ? await supabase.from('customers').select('id').eq('phone', phone).maybeSingle()
      : { data: null };

    const existing = (existingByEmail.data ?? existingByPhone.data) as { id: string } | null;
    if (existing) {
      customerId = existing.id;
      await supabase
        .from('customers')
        .update({ full_name: form.full_name.trim(), phone, email })
        .eq('id', customerId);
    } else {
      const { data: newCustomer, error: errCustomer } = await supabase
        .from('customers')
        .insert({
          full_name: form.full_name.trim(),
          phone,
          email,
        })
        .select('id')
        .single();
      if (errCustomer || !newCustomer) {
        return { success: false, code: 'PERSISTENCE', message: 'Não foi possível registrar o cliente.' };
      }
      customerId = (newCustomer as { id: string }).id;
    }

    let addressSnapshotJson: AddressSnapshotPayload | null = null;
    if (form.fulfillment_type === FULFILLMENT_TYPE.DELIVERY && form.address) {
      addressSnapshotJson = toAddressSnapshot(form.address);
      await supabase.from('addresses').insert({
        customer_id: customerId,
        recipient_name: form.address.recipient_name,
        phone: form.address.phone,
        street: form.address.street,
        number: form.address.number,
        complement: form.address.complement || null,
        neighborhood: form.address.neighborhood,
        city: form.address.city,
        state: form.address.state,
        postal_code: form.address.postal_code,
        reference: form.address.reference || null,
      });
    }

    const discountAmount = 0;
    const totalAmount = cart.subtotal + shippingAmount - discountAmount;
    const publicCode = generatePublicCode();

    const initialOrderStatus =
      form.payment_method === PAYMENT_METHOD.MERCADO_PAGO
        ? ORDER_STATUS.PENDING_PAYMENT
        : ORDER_STATUS.AWAITING_APPROVAL;

    const { data: orderRow, error: errOrder } = await supabase
      .from('orders')
      .insert({
        public_code: publicCode,
        customer_id: customerId,
        status: initialOrderStatus,
        payment_status: PAYMENT_STATUS.PENDING,
        fulfillment_type: form.fulfillment_type,
        shipping_rule_id: form.fulfillment_type === FULFILLMENT_TYPE.DELIVERY ? shippingRuleId : null,
        shipping_amount: shippingAmount,
        subtotal_amount: cart.subtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: form.payment_method,
        customer_note: form.customer_note?.trim() || null,
        gift_message: form.gift_message?.trim() || null,
        address_snapshot_json: addressSnapshotJson,
      })
      .select('id')
      .single();

    if (errOrder || !orderRow) {
      return { success: false, code: 'PERSISTENCE', message: 'Não foi possível criar o pedido.' };
    }

    const orderId = (orderRow as { id: string }).id;

    const itemsToInsert = cart.items.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      product_name_snapshot: item.product_name_snapshot,
      unit_price_snapshot: item.unit_price_snapshot,
      quantity: item.quantity,
      line_total: item.line_total,
    }));

    const { error: errItems } = await supabase.from('order_items').insert(itemsToInsert);
    if (errItems) {
      await supabase.from('orders').delete().eq('id', orderId);
      return { success: false, code: 'PERSISTENCE', message: 'Não foi possível registrar os itens do pedido.' };
    }

    if (form.payment_method === PAYMENT_METHOD.MERCADO_PAGO) {
      const payResult = await createMpPaymentForOrder(supabase, orderId, publicCode, totalAmount, email);

      if (!payResult.ok) {
        await supabase.from('order_items').delete().eq('order_id', orderId);
        await supabase.from('orders').delete().eq('id', orderId);
        return { success: false, code: 'PERSISTENCE', message: payResult.error };
      }

      return {
        success: true,
        publicCode,
        orderId,
        paymentFlow: 'mercado_pago',
        initPoint: payResult.initPoint,
        mpError: payResult.mpError,
      };
    }

    /*
     * --- Stripe (checkout one-shot) — DESATIVADO NO MVP / PRODUÇÃO ATUAL ---
     * Reativar: descomentar imports no topo, remover o early-return STRIPE acima,
     * e descomentar o bloco abaixo + opção na UI (CheckoutFulfillmentSection).
     *
    if (form.payment_method === PAYMENT_METHOD.STRIPE) {
      const { data: payIns, error: payErr } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          provider: 'stripe',
          amount: totalAmount,
          status: PAYMENT_STATUS.PENDING,
          expires_at: expiresAt,
        })
        .select('id')
        .single();

      if (payErr || !payIns) {
        await supabase.from('order_items').delete().eq('order_id', orderId);
        await supabase.from('orders').delete().eq('id', orderId);
        return { success: false, code: 'PERSISTENCE', message: 'Não foi possível registrar o pagamento.' };
      }

      try {
        const result = await createOneTimeCheckout({
          items: cart.items.map((item) => ({
            name: item.product_name_snapshot,
            price: item.unit_price_snapshot,
            quantity: item.quantity,
          })),
          customerEmail: email ?? undefined,
          metadata: { order_id: orderId, public_code: publicCode },
        });

        return {
          success: true,
          publicCode,
          orderId,
          paymentFlow: 'stripe',
          stripeUrl: result.url,
        };
      } catch (e) {
        await supabase.from('payments').delete().eq('order_id', orderId);
        await supabase.from('order_items').delete().eq('order_id', orderId);
        await supabase.from('orders').delete().eq('id', orderId);
        return {
          success: false,
          code: 'STRIPE_SESSION',
          message: e instanceof Error ? e.message : 'Erro ao criar sessão de pagamento Stripe.',
        };
      }
    }
     */

    const { error: payManualErr } = await supabase.from('payments').insert({
      order_id: orderId,
      provider: 'manual',
      amount: totalAmount,
      status: PAYMENT_STATUS.PENDING,
      expires_at: null,
    });

    if (payManualErr) {
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('orders').delete().eq('id', orderId);
      return {
        success: false,
        code: 'PERSISTENCE',
        message: 'Não foi possível registrar o pagamento.',
      };
    }

    return {
      success: true,
      publicCode,
      orderId,
      paymentFlow: 'offline',
    };
  } catch {
    return { success: false, code: 'PERSISTENCE', message: 'Erro ao processar o pedido.' };
  }
}
