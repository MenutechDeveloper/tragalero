-- ==========================================================
-- SCRIPT DE REPARACIÓN DE USUARIO - TRAGALERO
-- ==========================================================
-- Instrucciones:
-- 1. Ve al SQL Editor de tu panel de Supabase.
-- 2. Copia y pega este script.
-- 3. IMPORTANTE: Cambia 'TU_EMAIL_AQUI@ejemplo.com' por el correo de tu cuenta.
-- 4. Presiona 'Run'.

-- 0. Corregir restricción de contraseña (permite sincronizar usuarios de Auth)
ALTER TABLE public.usuarios ALTER COLUMN password DROP NOT NULL;

DO $$
DECLARE
    target_email TEXT := 'TU_EMAIL_AQUI@ejemplo.com'; -- <--- CAMBIA ESTO
    target_id UUID;
    target_name TEXT;
BEGIN
    -- 1. Buscar el ID del usuario en auth.users
    SELECT id, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1))
    INTO target_id, target_name
    FROM auth.users
    WHERE email = target_email;

    IF target_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún usuario con el correo % en la tabla auth.users.', target_email;
    END IF;

    -- 2. Insertar o actualizar en public.usuarios
    INSERT INTO public.usuarios (id, name, role)
    VALUES (target_id, target_name, 'Owner')
    ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(public.usuarios.name, EXCLUDED.name);

    RAISE NOTICE 'Usuario % (%) sincronizado con éxito.', target_name, target_email;

END $$;
