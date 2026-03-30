#!/usr/bin/env sh
# Copia migrations da fonte canônica para o path esperado pelo Supabase CLI (supabase/migrations).
# Rode após alterar arquivos em supabase/floricultura/migrations/

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/supabase/floricultura/migrations"
DST="$ROOT/supabase/floricultura/supabase/migrations"
mkdir -p "$DST"
cp "$SRC"/*.sql "$DST/"
echo "OK: $DST atualizado a partir de $SRC"
