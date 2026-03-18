# Ambiente, Variáveis e Deploy

## Variáveis mínimas por app
```env
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_PUBLIC_KEY=
MERCADO_PAGO_WEBHOOK_SECRET=
WHATSAPP_PROVIDER=
WHATSAPP_WEBHOOK_URL=
NOTIFICATION_DEFAULT_PHONE=
RESEND_API_KEY=
DEFAULT_FROM_EMAIL=
```

## Buckets sugeridos
- `product-images`
- `banner-images`
- `brand-assets`

## Política de deploy
- 1 projeto Vercel por app;
- variáveis isoladas por projeto;
- webhooks apontando para domínio do app correto;
- storage e banco isolados por empresa.

## Seeds mínimas
Cada app deve ter seed com:
- settings iniciais;
- 2 categorias;
- 4 produtos;
- 1 taxa de entrega;
- 1 admin de desenvolvimento.

## Checklist de produção
- domínio configurado;
- envs configuradas;
- buckets criados;
- policies revisadas;
- webhook do Mercado Pago validado;
- admin inicial criado;
- importação inicial de catálogo executada;
- smoke test completo realizado.
