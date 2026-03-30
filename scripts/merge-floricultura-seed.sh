#!/usr/bin/env sh
# Gera supabase/seed.sql a partir de seeds/*.sql (Supabase CLI não suporta \i no seed).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
F="$ROOT/supabase/floricultura"
{
  echo "-- GERADO — não editar. Fonte: seeds/01_*.sql + 02_*.sql + 03_*.sql. Rodar: pnpm db:floricultura:merge-seed"
  cat "$F/seeds/01_settings_and_catalog.sql"
  echo
  cat "$F/seeds/02_dev_customer_and_order.sql"
  echo
  if [ -f "$F/seeds/03_subscriptions_and_addons.sql" ]; then
    cat "$F/seeds/03_subscriptions_and_addons.sql"
  fi
} > "$F/supabase/seed.sql"
echo "OK: $F/supabase/seed.sql"
