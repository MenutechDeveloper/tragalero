-- Habilitar pgcrypto para el hash de contraseñas (necesario para crypt y gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'francisco.menutech@gmail.com';
  user_password TEXT := '9090Asd';
  user_name TEXT := 'Antonio';
BEGIN
  -- 1. Insertar en auth.users (Sistema de Autenticación de Supabase)
  -- Solo si el usuario no existe ya por email
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
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      crypt(user_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('username', user_name),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO new_user_id;
    RAISE NOTICE 'Nuevo usuario creado en auth.users con ID: %', new_user_id;
  ELSE
    SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;
    RAISE NOTICE 'El usuario ya existía en auth.users con ID: %. Se procederá a asegurar que su perfil sea Admin.', new_user_id;
  END IF;

  -- 2. Asegurar que el usuario tenga el rol de Admin en directory_users
  -- Intentamos insertar o actualizar por ID
  BEGIN
    INSERT INTO public.directory_users (id, name, role)
    VALUES (new_user_id, user_name, 'Admin')
    ON CONFLICT (id) DO UPDATE SET
      role = 'Admin',
      name = user_name;
  EXCEPTION WHEN unique_violation THEN
    -- Si hay un conflicto de nombre único con otro ID, actualizamos por nombre
    UPDATE public.directory_users SET role = 'Admin' WHERE name = user_name;
  END;

  RAISE NOTICE 'Perfil en directory_users configurado como Admin para: %', user_name;
END $$;
