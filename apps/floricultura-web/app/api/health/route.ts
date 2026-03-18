import { NextResponse } from 'next/server';

/**
 * Health check para deploy e monitoramento.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', app: 'floricultura-web' });
}
