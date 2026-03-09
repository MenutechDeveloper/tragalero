-- SQL Setup for Tragalero Directory (Simple Version)
-- This script creates the schema without RLS or Supabase Auth dependencies.
-- It uses a custom user management system with username and password.

-- 1. Create the usuarios table
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Owner' CHECK (role IN ('Owner', 'Admin')),
    is_active BOOLEAN DEFAULT TRUE,
    max_businesses INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    zip TEXT,
    category TEXT DEFAULT 'Varios',
    logo_url TEXT,
    website TEXT,
    address_detail TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    social_media JSONB DEFAULT '{}'::jsonb,
    hours JSONB DEFAULT '{}'::jsonb,
    is_restaurant BOOLEAN DEFAULT FALSE,
    cuid TEXT,
    ruid TEXT,
    has_reservation BOOLEAN DEFAULT FALSE,
    order_url TEXT,
    reservation_url TEXT,
    order_bg_color TEXT DEFAULT '#f2a04a',
    order_text_color TEXT DEFAULT '#ffffff',
    res_bg_color TEXT DEFAULT '#2f4854',
    res_text_color TEXT DEFAULT '#ffffff',
    btn_bg_color TEXT DEFAULT '#f1c40f',
    btn_text_color TEXT DEFAULT '#ffffff',
    is_visible BOOLEAN DEFAULT TRUE,
    owner_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create the bento_grid table
CREATE TABLE IF NOT EXISTS public.bento_grid (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    link_url TEXT,
    col_span INTEGER DEFAULT 1,
    row_span INTEGER DEFAULT 1,
    bg_color TEXT DEFAULT '#dcf0fa',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create the digital_cards table
CREATE TABLE IF NOT EXISTS public.digital_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    card_name TEXT,
    header_config JSONB DEFAULT '{}'::jsonb,
    portfolio JSONB DEFAULT '[]'::jsonb,
    social_media JSONB DEFAULT '{}'::jsonb,
    before_after JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 5. Create the user_websites table
CREATE TABLE IF NOT EXISTS public.user_websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 6. Seed an initial admin user
-- NOTE: In this simplified version, passwords are stored in plain text as requested.
INSERT INTO public.usuarios (name, password, role)
VALUES ('admin', 'admin123', 'Admin')
ON CONFLICT (name) DO NOTHING;

-- 7. Disable RLS on all tables (to be certain)
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bento_grid DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_websites DISABLE ROW LEVEL SECURITY;
