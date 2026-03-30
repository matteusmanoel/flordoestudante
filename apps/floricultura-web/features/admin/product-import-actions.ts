/**
 * Server action para importação de produtos via XLSX.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  parseProductsXlsx,
  validateProductsRows,
  generateCategorySlug,
  generateProductSlug,
  type ProductImportRow,
} from '@flordoestudante/core';
import { requireAdminSession } from './session';

interface ImportResult {
  ok: boolean;
  message: string;
  importLogId?: string;
  totalRows?: number;
  importedRows?: number;
  failedRows?: number;
  errorReport?: Array<{ row: number; field?: string; message: string }>;
}

export async function importProductsFromXlsxAction(formData: FormData): Promise<ImportResult> {
  try {
    await requireAdminSession();
    const file = formData.get('file') as File | null;

    if (!file) {
      return { ok: false, message: 'Nenhum arquivo enviado' };
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return { ok: false, message: 'Formato inválido. Use arquivos .xlsx ou .xls' };
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { ok: false, message: 'Arquivo muito grande. Tamanho máximo: 5 MB' };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = createServerSupabaseClient();

    const { data: importLog, error: logError } = await supabase
      .from('imports_log')
      .insert({
        file_name: file.name,
        import_type: 'products_xlsx_v1',
        status: 'running',
        total_rows: 0,
        imported_rows: 0,
        failed_rows: 0,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (logError || !importLog) {
      return { ok: false, message: 'Erro ao registrar importação' };
    }

    const importLogId = importLog.id;

    let rawRows;
    try {
      rawRows = parseProductsXlsx(buffer);
    } catch (err) {
      await supabase
        .from('imports_log')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_report_json: { parse_error: String(err) },
        })
        .eq('id', importLogId);
      return { ok: false, message: `Erro ao ler planilha: ${String(err)}` };
    }

    const { validRows, errorRows } = validateProductsRows(rawRows);
    const totalRows = rawRows.length;
    let importedCount = 0;

    for (const row of validRows) {
      try {
        await importProductRow(supabase, row);
        importedCount++;
      } catch (err) {
        errorRows.push({
          row: validRows.indexOf(row) + 2,
          message: `Erro ao importar: ${String(err)}`,
        });
      }
    }

    const failedCount = totalRows - importedCount;
    const finalStatus = failedCount === totalRows ? 'failed' : failedCount > 0 ? 'partial' : 'completed';

    await supabase
      .from('imports_log')
      .update({
        status: finalStatus,
        total_rows: totalRows,
        imported_rows: importedCount,
        failed_rows: failedCount,
        finished_at: new Date().toISOString(),
        error_report_json: errorRows.length > 0 ? { errors: errorRows } : null,
      })
      .eq('id', importLogId);

    revalidatePath('/admin/produtos');
    revalidatePath('/admin/produtos/import');

    return {
      ok: true,
      message:
        importedCount === totalRows
          ? `${importedCount} produto(s) importado(s) com sucesso`
          : `${importedCount} produto(s) importado(s), ${failedCount} com erro(s)`,
      importLogId,
      totalRows,
      importedRows: importedCount,
      failedRows: failedCount,
      errorReport: errorRows,
    };
  } catch (err) {
    return { ok: false, message: `Erro inesperado: ${String(err)}` };
  }
}

async function importProductRow(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  row: ProductImportRow
) {
  const categorySlug = generateCategorySlug(row.categoria_nome, row.categoria_slug);

  let categoryId: string | null = null;
  const { data: existingCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (existingCategory) {
    categoryId = existingCategory.id;
  } else {
    const { data: newCategory, error: catError } = await supabase
      .from('categories')
      .insert({
        name: row.categoria_nome,
        slug: categorySlug,
        is_active: true,
        sort_order: 0,
      })
      .select('id')
      .single();

    if (catError) throw new Error(`Erro ao criar categoria: ${catError.message}`);
    categoryId = newCategory.id;
  }

  const productSlug = generateProductSlug(row.produto_nome);
  const { data: existingProduct } = await supabase
    .from('products')
    .select('id')
    .eq('slug', productSlug)
    .single();

  let productId: string;

  if (existingProduct) {
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        category_id: categoryId,
        name: row.produto_nome,
        short_description: row.descricao_curta || null,
        description: row.descricao || null,
        price: row.preco.toString(),
        compare_at_price: row.preco_comparacao ? row.preco_comparacao.toString() : null,
        cover_image_url: row.imagem_capa_url || null,
        is_active: row.ativo ?? true,
        is_featured: row.destaque ?? false,
      })
      .eq('id', existingProduct.id)
      .select('id')
      .single();

    if (updateError) throw new Error(`Erro ao atualizar produto: ${updateError.message}`);
    productId = updatedProduct.id;
  } else {
    const { data: newProduct, error: prodError } = await supabase
      .from('products')
      .insert({
        category_id: categoryId,
        name: row.produto_nome,
        slug: productSlug,
        short_description: row.descricao_curta || null,
        description: row.descricao || null,
        price: row.preco.toString(),
        compare_at_price: row.preco_comparacao ? row.preco_comparacao.toString() : null,
        cover_image_url: row.imagem_capa_url || null,
        is_active: row.ativo ?? true,
        is_featured: row.destaque ?? false,
      })
      .select('id')
      .single();

    if (prodError) throw new Error(`Erro ao criar produto: ${prodError.message}`);
    productId = newProduct.id;
  }

  const extraImages = [row.imagem_extra_url_1, row.imagem_extra_url_2, row.imagem_extra_url_3].filter(
    (url) => url && url.trim()
  );

  if (extraImages.length > 0) {
    await supabase.from('product_images').delete().eq('product_id', productId);

    const imageInserts = extraImages.map((url, index) => ({
      product_id: productId,
      image_url: url,
      alt_text: row.produto_nome,
      sort_order: index + 1,
    }));

    const { error: imgError } = await supabase.from('product_images').insert(imageInserts);
    if (imgError) throw new Error(`Erro ao criar imagens: ${imgError.message}`);
  }
}
