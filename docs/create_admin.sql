-- ==========================================================
-- SQL FINAL PARA CREAR ADMIN (RLS PROTEGIDO)
-- ==========================================================
-- Este script crea un usuario en Supabase Auth y lo configura como Admin
-- MANTIENE EL RLS ACTIVADO y arregla el error de "Database error querying schema".

-- 1. Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Función auxiliar para evitar recursión en RLS
-- Esta función permite verificar el rol sin causar un bucle infinito.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.directory_users
    WHERE id = auth.uid() AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  -- A. LIMPIEZA TOTAL (Para asegurar un estado limpio)
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

  -- C. CREAR IDENTIDAD (Necesario para el login)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    new_user_id, new_user_id,
    jsonb_build_object('sub', new_user_id, 'email', user_email),
    'email', new_user_id, now(), now(), now()
  );

  -- D. ACTUALIZAR O CREAR PERFIL
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'directory_users'
    AND column_name = 'password'
  ) INTO has_password_col;

  IF has_password_col THEN
    EXECUTE format(
      'INSERT INTO public.directory_users (id, name, role, is_active, password)
       VALUES (%L, %L, %L, true, %L)
       ON CONFLICT (id) DO UPDATE SET role = %L, name = %L, password = %L, is_active = true',
      new_user_id, user_name, 'Admin', user_password, 'Admin', user_name, user_password
    );
  ELSE
    INSERT INTO public.directory_users (id, name, role, is_active)
    VALUES (new_user_id, user_name, 'Admin', true)
    ON CONFLICT (id) DO UPDATE SET role = 'Admin', name = EXCLUDED.name, is_active = true;
  END IF;

  RAISE NOTICE 'Usuario y perfil creados/actualizados correctamente.';
END $$;

-- E. CONFIGURAR POLÍTICAS DE RLS (MANTENIENDO SEGURIDAD)
-- Nos aseguramos de que el RLS esté ACTIVADO
ALTER TABLE public.directory_users ENABLE ROW LEVEL SECURITY;

-- Limpiamos políticas anteriores para poner las corregidas
DROP POLICY IF EXISTS "Users can view their own profile" ON public.directory_users;
DROP POLICY IF EXISTS "Admins have full access to directory_users" ON public.directory_users;

-- 1. Permitir que cada usuario vea su propio perfil
CREATE POLICY "Users can view their own profile" ON public.directory_users
    FOR SELECT USING (auth.uid() = id);

-- 2. Permitir que los Admins vean todo (usando la función para evitar el error de esquema)
CREATE POLICY "Admins have full access to directory_users" ON public.directory_users
    FOR ALL USING (public.check_is_admin());
