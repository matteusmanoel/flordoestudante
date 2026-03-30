/**
 * Parsing e validação de planilhas XLSX de produtos.
 */

import * as XLSX from 'xlsx';
import { z } from 'zod';
import { slugify } from '@flordoestudante/utils';
import type { ImportErrorRow } from '../types/imports';

const productRowSchema = z.object({
  categoria_nome: z.string().min(1, 'Nome da categoria é obrigatório'),
  categoria_slug: z.string().optional(),
  produto_nome: z.string().min(1, 'Nome do produto é obrigatório'),
  descricao_curta: z.string().optional(),
  descricao: z.string().optional(),
  preco: z.number().positive('Preço deve ser maior que zero'),
  preco_comparacao: z.number().optional(),
  ativo: z.boolean().optional().default(true),
  destaque: z.boolean().optional().default(false),
  imagem_capa_url: z.string().url().optional().or(z.literal('')),
  imagem_extra_url_1: z.string().url().optional().or(z.literal('')),
  imagem_extra_url_2: z.string().url().optional().or(z.literal('')),
  imagem_extra_url_3: z.string().url().optional().or(z.literal('')),
});

export type ProductImportRow = z.infer<typeof productRowSchema>;

interface RawRow {
  [key: string]: unknown;
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const str = String(value).toLowerCase().trim();
  if (str === 'true' || str === '1' || str === 'sim' || str === 'verdadeiro') return true;
  if (str === 'false' || str === '0' || str === 'não' || str === 'nao' || str === 'falso') return false;
  return undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return value;
  const str = String(value).replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? undefined : num;
}

function normalizeString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value).trim();
}

function normalizeRow(raw: RawRow): Partial<ProductImportRow> {
  return {
    categoria_nome: normalizeString(raw.categoria_nome),
    categoria_slug: normalizeString(raw.categoria_slug),
    produto_nome: normalizeString(raw.produto_nome),
    descricao_curta: normalizeString(raw.descricao_curta),
    descricao: normalizeString(raw.descricao),
    preco: normalizeNumber(raw.preco),
    preco_comparacao: normalizeNumber(raw.preco_comparacao),
    ativo: normalizeBoolean(raw.ativo),
    destaque: normalizeBoolean(raw.destaque),
    imagem_capa_url: normalizeString(raw.imagem_capa_url),
    imagem_extra_url_1: normalizeString(raw.imagem_extra_url_1),
    imagem_extra_url_2: normalizeString(raw.imagem_extra_url_2),
    imagem_extra_url_3: normalizeString(raw.imagem_extra_url_3),
  };
}

export function parseProductsXlsx(buffer: Buffer): RawRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Planilha vazia ou sem abas');
  }
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    throw new Error('Aba da planilha não encontrada');
  }
  const rawRows = XLSX.utils.sheet_to_json<RawRow>(worksheet);
  return rawRows;
}

export interface ValidateResult {
  validRows: ProductImportRow[];
  errorRows: ImportErrorRow[];
}

export function validateProductsRows(rawRows: RawRow[]): ValidateResult {
  const validRows: ProductImportRow[] = [];
  const errorRows: ImportErrorRow[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;
    const normalized = normalizeRow(raw);
    const result = productRowSchema.safeParse(normalized);

    if (result.success) {
      validRows.push(result.data);
    } else {
      const firstError = result.error.errors[0];
      errorRows.push({
        row: rowNumber,
        field: firstError?.path.join('.'),
        message: firstError?.message || 'Erro de validação',
      });
    }
  });

  return { validRows, errorRows };
}

export function generateCategorySlug(name: string, existingSlug?: string): string {
  if (existingSlug && existingSlug.trim()) {
    return existingSlug.trim();
  }
  return slugify(name);
}

export function generateProductSlug(name: string): string {
  return slugify(name);
}
