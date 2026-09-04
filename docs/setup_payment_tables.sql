-- ====================================================================
-- SCRIPT DE CONFIGURACIÓN DE TABLAS DE PAGOS EN LÍNEA EN SUPABASE
-- Ejecutar este script en el Editor SQL de tu panel de Supabase
-- ====================================================================

-- 1. Crear la tabla de configuración de pagos por cliente (OAuth Connect)
CREATE TABLE IF NOT EXISTS public.tragalero_payment_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,

    -- Stripe Connect
    stripe_connected BOOLEAN DEFAULT false,
    stripe_enabled BOOLEAN DEFAULT false,
    stripe_account_id TEXT,

    -- Mercado Pago OAuth
    mercadopago_connected BOOLEAN DEFAULT false,
    mercadopago_enabled BOOLEAN DEFAULT false,
    mercadopago_user_id TEXT,
    mercadopago_access_token TEXT,
    mercadopago_refresh_token TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT tragalero_payment_config_user_id_key UNIQUE (user_id)
);

-- 2. Habilitar RLS en tragalero_payment_config
ALTER TABLE public.tragalero_payment_config ENABLE ROW LEVEL SECURITY;

-- Politica de lectura para usuarios autenticados
CREATE POLICY "Permitir lectura de tragalero_payment_config"
    ON public.tragalero_payment_config FOR SELECT
    TO authenticated, anon
    USING (true);

-- Politica de insercion/actualización
CREATE POLICY "Permitir edicion de tragalero_payment_config"
    ON public.tragalero_payment_config FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Agregar columnas de estado de pago en la tabla tragalero_orders
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tragalero_orders' AND column_name='payment_status') THEN
        ALTER TABLE public.tragalero_orders ADD COLUMN payment_status TEXT DEFAULT 'PENDIENTE';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tragalero_orders' AND column_name='payment_id') THEN
        ALTER TABLE public.tragalero_orders ADD COLUMN payment_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tragalero_orders' AND column_name='payment_provider') THEN
        ALTER TABLE public.tragalero_orders ADD COLUMN payment_provider TEXT;
    END IF;
END $$;
