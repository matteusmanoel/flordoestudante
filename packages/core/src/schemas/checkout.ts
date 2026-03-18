/**
 * Schemas Zod para checkout (cliente, endereço, pedido draft).
 */

import { z } from 'zod';
import { FULFILLMENT_TYPE, PAYMENT_METHOD } from '../constants/domain';

const phoneSchema = z.string().min(10, 'Telefone inválido').max(20).optional().or(z.literal(''));
const emailSchema = z.string().email('E-mail inválido').optional().or(z.literal(''));

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
    address: addressSchema.optional(),
    customer_note: z.string().max(1000).optional(),
    gift_message: z.string().max(500).optional(),
    payment_method: z.enum([
      PAYMENT_METHOD.MERCADO_PAGO,
      PAYMENT_METHOD.PAY_ON_DELIVERY,
      PAYMENT_METHOD.PAY_ON_PICKUP,
    ]),
    shipping_rule_id: z.string().uuid().optional().nullable(),
  })
  .refine((data) => data.phone?.trim() || data.email?.trim(), {
    message: 'Informe telefone ou e-mail',
    path: ['phone'],
  })
  .refine(
    (data) => {
      if (data.fulfillment_type === 'delivery') {
        return data.address != null && data.shipping_rule_id != null;
      }
      return true;
    },
    { message: 'Endereço e taxa de entrega são obrigatórios para entrega', path: ['address'] }
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
