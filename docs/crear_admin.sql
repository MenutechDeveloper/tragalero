-- ==========================================================
-- SQL PARA CREAR ADMIN Y REPARAR ERROR DE ESQUEMA (RLS)
-- ==========================================================
-- Copia y pega esto en el SQL Editor de Supabase.

-- 1. Asegurar que pgcrypto esté disponible para las contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. REPARAR RECURSIVIDAD EN RLS (El error de "querying schema")
-- Creamos una función con SECURITY DEFINER para chequear si es admin
-- Esto evita que la política entre en un bucle infinito al consultarse a sí misma.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $f$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.directory_users
        WHERE id = auth.uid() AND role = 'Admin'
    );
END;
$f$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Actualizamos las políticas para usar la función segura
DROP POLICY IF EXISTS "Admins have full access to directory_users" ON public.directory_users;
CREATE POLICY "Admins have full access to directory_users" ON public.directory_users
FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admins have full access to businesses" ON public.businesses;
CREATE POLICY "Admins have full access to businesses" ON public.businesses
FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admins have full access to bento_grid" ON public.bento_grid;
CREATE POLICY "Admins have full access to bento_grid" ON public.bento_grid
FOR ALL USING (public.check_is_admin());

-- 3. CREAR O ACTUALIZAR EL USUARIO ADMIN
DO $$
DECLARE
    target_user_id UUID;
    user_email TEXT := 'francisco.menutech@gmail.com';
    user_password TEXT := '9090Asd';
    user_name TEXT := 'Antonio';
BEGIN

    -- Comprobar si el usuario existe en auth.users
    SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;

    IF target_user_id IS NULL THEN
        -- Crear nuevo ID
        target_user_id := gen_random_uuid();

        -- Insertar en auth.users (Usuario autenticado y confirmado)
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        ) VALUES (
            target_user_id,
            '00000000-0000-0000-0000-000000000000',
            user_email,
            crypt(user_password, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('username', user_name),
            'authenticated',
            'authenticated',
            now(),
            now(),
            '',
            '',
            '',
            ''
        );

        -- Insertar en auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            target_user_id,
            jsonb_build_object('sub', target_user_id, 'email', user_email),
            'email',
            target_user_id,
            now(),
            now(),
            now()
        );

        RAISE NOTICE 'Usuario creado en auth.users: %', user_email;
    ELSE
        RAISE NOTICE 'El usuario % ya existía en auth.users.', user_email;
    END IF;

    -- 4. ASEGURAR PERFIL EN PUBLIC.DIRECTORY_USERS
    INSERT INTO public.directory_users (id, name, role)
    VALUES (target_user_id, user_name, 'Admin')
    ON CONFLICT (id) DO UPDATE SET role = 'Admin';

    RAISE NOTICE 'Perfil de Admin asegurado para %', user_email;

END $$;

-- ==========================================================
-- IMPORTANTE:
-- Si el error "Database error querying schema" persiste:
-- 1. Ve a "Settings" -> "API" en tu panel de Supabase.
-- 2. Haz clic en el botón "Reload PostgREST schema".
-- ==========================================================
