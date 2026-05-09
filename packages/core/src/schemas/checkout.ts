/**
 * Schemas Zod para checkout (cliente, endereço, pedido draft).
 */

import { z } from 'zod';
import { FULFILLMENT_TYPE, PAYMENT_METHOD } from '../constants/domain';

const phoneSchema = z.string().min(10, 'Telefone inválido').max(20).optional().or(z.literal(''));
const emailSchema = z.string().email('E-mail inválido').optional().or(z.literal(''));
const pickupPhoneSchema = z.string().min(10, 'Telefone do destinatário inválido').max(20).optional().or(z.literal(''));

export const checkoutContactSchema = z
  .object({
    full_name: z.string().min(1, 'Nome é obrigatório').max(200),
    phone: phoneSchema,
    email: emailSchema,
  })
  .refine((data) => data.phone?.trim() || data.email?.trim(), {
    message: 'Informe telefone ou e-mail',
    path: ['phone'],
  });

export const addressSchema = z.object({
  recipient_name: z.string().min(1, 'Nome do destinatário é obrigatório'),
  phone: z.string().min(10, 'Telefone inválido'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'UF com 2 caracteres'),
  postal_code: z.string().min(8, 'CEP inválido').max(9),
  reference: z.string().optional(),
});

const contactFields = {
  full_name: z.string().min(1, 'Nome é obrigatório').max(200),
  phone: phoneSchema,
  email: emailSchema,
};

export const checkoutFormSchema = z
  .object({
    ...contactFields,
    fulfillment_type: z.enum([FULFILLMENT_TYPE.DELIVERY, FULFILLMENT_TYPE.PICKUP]),
    // Endereço só deve ser validado quando for entrega.
    // Se o usuário alternar "Entrega" → "Retirada", o RHF pode manter um objeto `address`
    // com campos vazios no estado, o que não deve bloquear a finalização do pedido.
    address: addressSchema.partial().optional(),
    customer_note: z.string().max(1000).optional(),
    gift_message: z.string().max(500).optional(),
    payment_method: z.enum([
      PAYMENT_METHOD.MERCADO_PAGO,
      PAYMENT_METHOD.PAY_ON_DELIVERY,
      PAYMENT_METHOD.PAY_ON_PICKUP,
      PAYMENT_METHOD.STRIPE,
    ]),
    shipping_rule_id: z.string().uuid().optional().nullable(),
    pickup_recipient_name: z.string().max(200).optional().or(z.literal('')),
    pickup_phone: pickupPhoneSchema,
  })
  .refine((data) => data.phone?.trim() || data.email?.trim(), {
    message: 'Informe telefone ou e-mail',
    path: ['phone'],
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment_type !== FULFILLMENT_TYPE.DELIVERY) return;

    if (data.shipping_rule_id == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione uma taxa de entrega',
        path: ['shipping_rule_id'],
      });
    }

    const result = addressSchema.safeParse(data.address);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ['address', ...issue.path],
        });
      }
      return;
    }
  })
  .refine(
    (data) => {
      if (data.fulfillment_type === FULFILLMENT_TYPE.PICKUP) {
        return Boolean(data.pickup_recipient_name?.trim());
      }
      return true;
    },
    {
      message: 'Nome do destinatário é obrigatório para retirada',
      path: ['pickup_recipient_name'],
    }
  )
  .refine(
    (data) => {
      if (data.fulfillment_type === FULFILLMENT_TYPE.PICKUP) {
        return Boolean(data.pickup_phone?.trim());
      }
      return true;
    },
    {
      message: 'Telefone do destinatário é obrigatório para retirada',
      path: ['pickup_phone'],
    }
  )
  .refine(
    (data) => {
      if (data.payment_method === PAYMENT_METHOD.PAY_ON_DELIVERY) {
        return data.fulfillment_type === FULFILLMENT_TYPE.DELIVERY;
      }
      return true;
    },
    {
      message: 'Pagar na entrega só está disponível para entrega',
      path: ['payment_method'],
    }
  )
  .refine(
    (data) => {
      if (data.payment_method === PAYMENT_METHOD.PAY_ON_PICKUP) {
        return data.fulfillment_type === FULFILLMENT_TYPE.PICKUP;
      }
      return true;
    },
    {
      message: 'Pagar na retirada só está disponível para retirada na loja',
      path: ['payment_method'],
    }
  );

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type CheckoutContactValues = z.infer<typeof checkoutContactSchema>;
export type AddressFormValues = z.infer<typeof addressSchema>;
