/**
 * Schemas Zod para assinaturas, planos e complementos.
 */

import { z } from 'zod';
import { SUBSCRIPTION_FREQUENCY } from '../constants/domain';

export const subscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  slug: z.string().min(1).max(200),
  short_description: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  cover_image_url: z.string().optional().or(z.literal('')),
  price: z.number().min(0, 'Preço deve ser positivo'),
  frequency: z.enum([
    SUBSCRIPTION_FREQUENCY.WEEKLY,
    SUBSCRIPTION_FREQUENCY.BIWEEKLY,
    SUBSCRIPTION_FREQUENCY.MONTHLY,
  ]),
  delivery_day_of_week: z.number().int().min(0).max(6).optional().nullable(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
});

export type SubscriptionPlanFormValues = z.infer<typeof subscriptionPlanSchema>;

export const addonSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  slug: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().min(0, 'Preço deve ser positivo'),
  cover_image_url: z.string().optional().or(z.literal('')),
  addon_category: z.string().min(1, 'Categoria é obrigatória').max(50),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export type AddonFormValues = z.infer<typeof addonSchema>;

export const subscriptionCheckoutSchema = z.object({
  plan_id: z.string().uuid('Plano inválido'),
  full_name: z.string().min(1, 'Nome é obrigatório').max(200),
  phone: z.string().min(10, 'Telefone inválido').max(20),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  address: z.object({
    recipient_name: z.string().min(1, 'Nome do destinatário é obrigatório'),
    phone: z.string().min(10, 'Telefone inválido'),
    street: z.string().min(1, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().length(2, 'UF com 2 caracteres'),
    postal_code: z.string().min(8, 'CEP inválido').max(9),
  }),
  customer_note: z.string().max(1000).optional(),
  addon_ids: z.array(z.string().uuid()).optional().default([]),
});

export type SubscriptionCheckoutFormValues = z.infer<typeof subscriptionCheckoutSchema>;
