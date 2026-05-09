import { z } from 'zod';

const phoneSchema = z
  .string()
  .trim()
  .min(8, 'Informe um telefone válido.')
  .max(30, 'Informe um telefone válido.');

const postalCodeSchema = z
  .string()
  .trim()
  .min(8, 'Informe um CEP válido.')
  .max(9, 'Informe um CEP válido.')
  .refine((v) => /^\d{5}-?\d{3}$/.test(v), 'Informe um CEP válido.');

export const subscriptionCheckoutSchema = z.object({
  planId: z.string().min(1, 'Plano inválido.'),
  addonIds: z.array(z.string().min(1)).default([]),
  fullName: z.string().trim().min(2, 'Informe seu nome completo.'),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .email('Informe um e-mail válido.')
    .or(z.literal(''))
    .transform((v) => v.trim()),
  address: z.object({
    recipient_name: z.string().trim().min(2, 'Informe o nome do destinatário.'),
    phone: phoneSchema,
    street: z.string().trim().min(2, 'Informe a rua.'),
    number: z.string().trim().min(1, 'Informe o número.'),
    complement: z.string().trim().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
    neighborhood: z.string().trim().min(2, 'Informe o bairro.'),
    city: z.string().trim().min(2, 'Informe a cidade.'),
    state: z
      .string()
      .trim()
      .min(2, 'Informe a UF.')
      .max(2, 'Informe a UF.')
      .transform((v) => v.toUpperCase()),
    postal_code: postalCodeSchema,
  }),
  customerNote: z.string().trim().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  giftMessage: z.string().trim().optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
});

export type SubscriptionCheckoutSchemaValues = z.infer<typeof subscriptionCheckoutSchema>;
