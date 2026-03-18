import { processMercadoPagoPaymentById } from '@/features/payments/process-mercadopago-webhook';

function extractPaymentId(body: unknown): string | null {
  if (body == null || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  if (o.topic === 'payment' && o.resource != null) {
    return String(o.resource);
  }
  const data = o.data;
  if (data != null && typeof data === 'object' && (data as { id?: unknown }).id != null) {
    return String((data as { id: unknown }).id);
  }
  return null;
}

export async function POST(request: Request) {
  let paymentId: string | null = null;
  try {
    const body = await request.json();
    paymentId = extractPaymentId(body);
  } catch {
    /* empty */
  }

  if (!paymentId) {
    return Response.json({ received: true, processed: false }, { status: 200 });
  }

  try {
    const result = await processMercadoPagoPaymentById(paymentId);
    if (!result.ok) {
      console.warn('[mercado-pago webhook]', paymentId, result.reason ?? 'unknown');
    }
    return Response.json(
      { received: true, processed: result.ok },
      { status: 200 }
    );
  } catch (e) {
    console.error('[mercado-pago webhook]', paymentId, e);
    return Response.json({ received: true, processed: false }, { status: 200 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const topic = url.searchParams.get('topic');
  const id = url.searchParams.get('id');
  if (topic === 'payment' && id) {
    try {
      const result = await processMercadoPagoPaymentById(id);
      if (!result.ok) {
        console.warn('[mercado-pago webhook GET]', id, result.reason);
      }
    } catch (e) {
      console.error('[mercado-pago webhook GET]', id, e);
    }
  }
  return new Response('OK', { status: 200 });
}
