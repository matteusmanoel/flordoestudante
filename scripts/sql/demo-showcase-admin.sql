-- Utilizador admin apenas para demonstração (produção ou staging).
-- Executar no Supabase → SQL Editor (ou MCP execute_sql). Senha: FlorDemo2026!Show
-- Colunas geradas (confirmed_at, identities.email) omitidas — compatível com Auth recente.

DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'demo.showcase@flordoestudante.com.br';
  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      email_change_token_new, email_change, email_change_confirm_status,
      is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      uid,
      'authenticated',
      'authenticated',
      'demo.showcase@flordoestudante.com.br',
      crypt('FlorDemo2026!Show', gen_salt('bf')),
      now(), '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demonstração Showcase","email_verified":true}'::jsonb,
      now(), now(),
      '', '', 0,
      false, false
    );
    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      uid::text,
      uid,
      jsonb_build_object(
        'sub', uid::text,
        'email', 'demo.showcase@flordoestudante.com.br',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(), now(), now()
    );
  ELSE
    UPDATE auth.users SET
      encrypted_password = crypt('FlorDemo2026!Show', gen_salt('bf')),
      updated_at = now()
    WHERE id = uid;
  END IF;

  INSERT INTO public.admins (auth_user_id, email, full_name, role, is_active)
  VALUES (uid, 'demo.showcase@flordoestudante.com.br', 'Demonstração Showcase', 'manager', true)
  ON CONFLICT (auth_user_id) DO UPDATE SET
    is_active = true,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = now();
END $$;
