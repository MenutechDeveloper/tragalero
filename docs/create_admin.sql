-- ==========================================================
-- SQL PARA CREAR ADMIN SIN VERIFICACIÓN DE EMAIL (TEMPLATE)
-- ==========================================================
-- Este script crea un usuario en Supabase Auth y lo configura como Admin
-- en la tabla directory_users, saltándose la confirmación por correo.
-- REEMPLACE LOS VALORES ABAJO SEGÚN SEA NECESARIO.

-- 1. Habilitar la extensión necesaria para el hash de contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'REEMPLACE_CON_EMAIL'; -- ej: admin@ejemplo.com
  user_password TEXT := 'REEMPLACE_CON_PASSWORD';
  user_name TEXT := 'REEMPLACE_CON_NOMBRE';
  encrypted_pw TEXT;
BEGIN
  -- Generar el hash de la contraseña (bcrypt)
  encrypted_pw := crypt(user_password, gen_salt('bf'));

  -- 2. Insertar en auth.users si no existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      is_super_admin
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      encrypted_pw,
      now(), -- Marca el email como confirmado inmediatamente
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('username', user_name),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      false
    )
    RETURNING id INTO new_user_id;

    -- 3. Insertar en auth.identities (CRUCIAL para que Supabase lo reconozca en el login)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id,
      new_user_id,
      jsonb_build_object('sub', new_user_id, 'email', user_email),
      'email',
      new_user_id,
      now(),
      now(),
      now()
    );

    RAISE NOTICE 'Usuario creado con ID: %', new_user_id;
  ELSE
    SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;

    UPDATE auth.users
    SET encrypted_password = encrypted_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = new_user_id;

    RAISE NOTICE 'Usuario existente actualizado con ID: %', new_user_id;
  END IF;

  -- 4. Sincronizar con la tabla de perfiles de la aplicación (public.directory_users)
  BEGIN
    INSERT INTO public.directory_users (id, name, role, is_active)
    VALUES (new_user_id, user_name, 'Admin', true)
    ON CONFLICT (id) DO UPDATE SET
      role = 'Admin',
      name = EXCLUDED.name,
      is_active = true;
  EXCEPTION WHEN unique_violation THEN
    UPDATE public.directory_users
    SET role = 'Admin',
        is_active = true,
        id = new_user_id
    WHERE name = user_name;
  END;

  RAISE NOTICE 'Perfil de Admin configurado correctamente para %', user_name;
END $$;
