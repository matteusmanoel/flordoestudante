#!/usr/bin/env node
/**
 * Seed floricultura: cria usuário admin no Supabase Auth + linha em admins e aplica seed SQL.
 * Uso (na raiz do monorepo): pnpm seed:floricultura
 * Requer: apps/floricultura-web/.env ou .env.local com NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e DATABASE_URL.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPaths = [
  resolve(root, 'apps/floricultura-web/.env.local'),
  resolve(root, 'apps/floricultura-web/.env'),
];

for (const p of envPaths) {
  config({ path: p });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const DATABASE_URL = (process.env.DATABASE_URL || process.env[' DATABASE_URL'] || '').trim();

const ADMIN_EMAIL = 'admin@flordoestudante.com.br';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_FULL_NAME = 'Admin Flor do Estudante';

function fail(msg) {
  console.error('[seed]', msg);
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  fail('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em apps/floricultura-web/.env (ou .env.local).');
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('[seed] Criando usuário admin no Supabase Auth...');
  const { data: user, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_FULL_NAME },
  });

  let authUserId;
  if (authError) {
    if (authError.message?.includes('already been registered')) {
      console.log('[seed] Usuário admin já existe no Auth; buscando id.');
      const { data: existing } = await supabase.auth.admin.listUsers();
      const adminUser = existing?.users?.find((u) => u.email === ADMIN_EMAIL);
      if (!adminUser) fail('Usuário com esse email não encontrado após listUsers.');
      authUserId = adminUser.id;
    } else {
      fail('Auth: ' + authError.message);
    }
  } else {
    authUserId = user.user?.id;
    console.log('[seed] Usuário criado:', authUserId);
  }

  if (!DATABASE_URL) {
    console.log('[seed] DATABASE_URL não definido. Defina para inserir admins e seed SQL.');
    printCredentials();
    return;
  }

  const client = new pg.Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    await ensureAdminRowPg(client, authUserId);
    console.log('[seed] Aplicando seed SQL (settings, categorias, produtos, banners, frete, cliente/pedido)...');
    const seedPath = resolve(root, 'supabase/floricultura/supabase/seed.sql');
    const seedSql = readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('[seed] Seed SQL aplicado com sucesso.');
  } catch (e) {
    console.error('[seed] Erro:', e.message);
    if (e.message?.includes('does not exist')) {
      console.error('[seed] Dica: aplique as migrations no projeto (Supabase Dashboard SQL ou: cd supabase/floricultura && supabase link --project-ref <REF> && supabase db push).');
    }
    if (e.message?.includes('password authentication')) {
      console.error('[seed] Dica: DATABASE_URL deve usar a senha real do banco (Supabase Dashboard → Settings → Database), não o project ref.');
    }
    printCredentials();
    process.exit(1);
  } finally {
    await client.end();
  }

  printCredentials();
}

async function ensureAdminRowPg(client, authUserId) {
  const res = await client.query(
    `INSERT INTO public.admins (auth_user_id, email, full_name, role, is_active)
     VALUES ($1, $2, $3, 'owner', true)
     ON CONFLICT (auth_user_id) DO UPDATE SET
       email = EXCLUDED.email,
       full_name = EXCLUDED.full_name,
       is_active = true,
       updated_at = now()`,
    [authUserId, ADMIN_EMAIL, ADMIN_FULL_NAME]
  );
  console.log('[seed] Linha em admins criada/atualizada.');
}

function printCredentials() {
  console.log('\n--- Credenciais de teste (admin) ---');
  console.log('E-mail:', ADMIN_EMAIL);
  console.log('Senha:', ADMIN_PASSWORD);
  console.log('Use em: /admin/login');
  console.log('------------------------------------\n');
}

main();
