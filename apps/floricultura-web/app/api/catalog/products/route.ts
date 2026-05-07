import { NextResponse } from 'next/server';
import { getProducts } from '@/features/catalog/data';

function parsePositiveInt(raw: string | null, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get('categoria') ?? undefined;
  const searchQuery = searchParams.get('q') ?? undefined;
  const offset = parsePositiveInt(searchParams.get('offset'), 0);
  const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 24), 48);

  const { products, total } = await getProducts({
    categorySlug,
    query: searchQuery,
    offset,
    limit,
  });

  return NextResponse.json({
    products,
    total,
    offset,
    limit,
  });
}
