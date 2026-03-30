/**
 * Upload de imagens para Supabase Storage.
 * POST /api/upload?bucket=products|banners
 * Body: FormData com campo "file"
 * Requer sessão de admin autenticado.
 */

import { NextResponse } from 'next/server';
import { uploadProductImage, uploadBannerImage, uploadPlanImage, uploadAddonImage } from '@/lib/supabase/upload';
import { getOptionalAdminSession } from '@/features/admin/session';

export async function POST(request: Request) {
  const session = await getOptionalAdminSession();
  if (!session.admin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const bucket = url.searchParams.get('bucket') ?? 'products';

  const formData = await request.formData();
  const file = formData.get('file');
  const productId = formData.get('productId')?.toString() ?? 'temp';
  const index = Number(formData.get('index') ?? 0);

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 });
  }

  if (bucket === 'banners') {
    const result = await uploadBannerImage(file);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ path: result.path, url: result.url });
  }

  if (bucket === 'plans') {
    const planId = formData.get('planId')?.toString() ?? 'new';
    const result = await uploadPlanImage(file, planId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ path: result.path, url: result.url });
  }

  if (bucket === 'addons') {
    const addonId = formData.get('addonId')?.toString() ?? 'new';
    const result = await uploadAddonImage(file, addonId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ path: result.path, url: result.url });
  }

  const result = await uploadProductImage(file, productId, index);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ path: result.path, url: result.url });
}
