-- ==========================================================
-- SQL PARA CREAR ADMIN SIN VERIFICACIÓN DE EMAIL (TEMPLATE)
-- ==========================================================
-- Este script crea un usuario en Supabase Auth y lo configura como Admin
-- en la tabla directory_users, saltándose la confirmación por correo.

-- 1. Habilitar extensiones y preparar esquema
CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE public.directory_users ADD COLUMN IF NOT EXISTS email TEXT;

DO $$
DECLARE
  -- >>> CONFIGURACIÓN <<<
  user_email TEXT := 'REEMPLACE_CON_EMAIL';
  user_password TEXT := 'REEMPLACE_CON_PASSWORD';
  user_name TEXT := 'REEMPLACE_CON_NOMBRE';
  -- >>> FIN CONFIGURACIÓN <<<

  new_user_id UUID := gen_random_uuid();
  old_user_id UUID;
  encrypted_pw TEXT;
  has_password_col BOOLEAN;
BEGIN
  encrypted_pw := crypt(user_password, gen_salt('bf'));

  -- A. LIMPIEZA TOTAL
  SELECT id INTO old_user_id FROM auth.users WHERE email = user_email;
  IF old_user_id IS NOT NULL THEN
    DELETE FROM public.directory_users WHERE id = old_user_id;
    DELETE FROM auth.users WHERE id = old_user_id;
  END IF;
  DELETE FROM public.directory_users WHERE name = user_name;

  -- B. CREAR EN AUTH.USERS
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    role, aud, confirmation_token, is_super_admin
  )
  VALUES (
    new_user_id, '00000000-0000-0000-0000-000000000000',
    user_email, encrypted_pw, now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('username', user_name),
    now(), now(), 'authenticated', 'authenticated', '', false
  )
  RETURNING id INTO new_user_id;

  -- C. CREAR IDENTIDAD
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (new_user_id, new_user_id, jsonb_build_object('sub', new_user_id, 'email', user_email), 'email', new_user_id, now(), now(), now());

  -- D. ACTUALIZAR O CREAR PERFIL
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'directory_users' AND column_name = 'password') INTO has_password_col;

  IF has_password_col THEN
    EXECUTE format(
      'INSERT INTO public.directory_users (id, name, email, role, is_active, password)
       VALUES (%L, %L, %L, %L, true, %L)
       ON CONFLICT (id) DO UPDATE SET role = %L, name = %L, email = %L, password = %L, is_active = true',
      new_user_id, user_name, user_email, 'Admin', user_password, 'Admin', user_name, user_email, user_password
    );
  ELSE
    INSERT INTO public.directory_users (id, name, email, role, is_active)
    VALUES (new_user_id, user_name, user_email, 'Admin', true)
    ON CONFLICT (id) DO UPDATE SET role = 'Admin', name = EXCLUDED.name, email = user_email, is_active = true;
  END IF;

  RAISE NOTICE 'Usuario y perfil creados/actualizados correctamente.';
END $$;

-- E. CONFIGURAR POLÍTICA DE SEGURIDAD (RLS)
-- Nota: La función check_is_admin() permite RLS sin recursión.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.directory_users
    WHERE id = auth.uid() AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.directory_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.directory_users;
CREATE POLICY "Users can view their own profile" ON public.directory_users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins have full access to directory_users" ON public.directory_users;
CREATE POLICY "Admins have full access to directory_users" ON public.directory_users FOR ALL USING (public.check_is_admin());
