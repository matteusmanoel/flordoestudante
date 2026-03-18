/**
 * Schemas Zod para catálogo (categoria, produto, banner).
 */

import { z } from 'zod';
import { PRODUCT_KIND } from '../constants/domain';

export const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  slug: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export const productSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(300),
  slug: z.string().min(1).max(300),
  short_description: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  price: z.number().min(0, 'Preço deve ser positivo'),
  compare_at_price: z.number().min(0).optional().nullable(),
  cover_image_url: z.string().min(1, 'Imagem de capa é obrigatória'),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  product_kind: z.enum([PRODUCT_KIND.REGULAR, PRODUCT_KIND.CUSTOMIZABLE]),
  metadata_json: z.record(z.unknown()).optional().nullable(),
});

export const bannerSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  image_url: z.string().url(),
  cta_label: z.string().max(100).optional(),
  cta_href: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export const shippingRuleSchema = z.object({
  name: z.string().min(1).max(200),
  rule_type: z.string().min(1),
  amount: z.number().min(0),
  description: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});
