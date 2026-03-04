-- SQL Setup for Tragalero Directory
-- This script recreates the schema and implements RLS policies for the new Supabase project.

-- 1. Create the directory_users table (linking to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.directory_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Owner' CHECK (role IN ('Owner', 'Admin')),
    is_active BOOLEAN DEFAULT TRUE,
    max_businesses INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'directory_users_name_key') THEN
        ALTER TABLE public.directory_users ADD CONSTRAINT directory_users_name_key UNIQUE (name);
    END IF;
END $$;

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
    owner_id UUID REFERENCES public.directory_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create the bento_grid table
CREATE TABLE IF NOT EXISTS public.bento_grid (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.directory_users(id) ON DELETE CASCADE,
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
    user_id UUID REFERENCES public.directory_users(id) ON DELETE CASCADE,
    card_name TEXT,
    header_config JSONB DEFAULT '{}'::jsonb,
    portfolio JSONB DEFAULT '[]'::jsonb,
    social_media JSONB DEFAULT '{}'::jsonb,
    before_after JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 5. Helper function for safe Admin check (prevents recursion)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.directory_users
        WHERE id = auth.uid() AND role = 'Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.directory_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bento_grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_cards ENABLE ROW LEVEL SECURITY;

-- 7. Secure RLS Policies
DROP POLICY IF EXISTS "Public profile view" ON public.directory_users;
CREATE POLICY "Public profile view" ON public.directory_users FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Self manage profile" ON public.directory_users;
CREATE POLICY "Self manage profile" ON public.directory_users FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin full access users" ON public.directory_users;
CREATE POLICY "Admin full access users" ON public.directory_users FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Public business view" ON public.businesses;
CREATE POLICY "Public business view" ON public.businesses FOR SELECT USING (is_visible = TRUE);

DROP POLICY IF EXISTS "Owner manage business" ON public.businesses;
CREATE POLICY "Owner manage business" ON public.businesses FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admin full access business" ON public.businesses;
CREATE POLICY "Admin full access business" ON public.businesses FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Owner manage grid" ON public.bento_grid;
CREATE POLICY "Owner manage grid" ON public.bento_grid FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access grid" ON public.bento_grid;
CREATE POLICY "Admin full access grid" ON public.bento_grid FOR ALL USING (public.check_is_admin());

DROP POLICY IF EXISTS "Public card view" ON public.digital_cards;
CREATE POLICY "Public card view" ON public.digital_cards FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Owner manage card" ON public.digital_cards;
CREATE POLICY "Owner manage card" ON public.digital_cards FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access card" ON public.digital_cards;
CREATE POLICY "Admin full access card" ON public.digital_cards FOR ALL USING (public.check_is_admin());

-- 8. Trigger to automatically create a profile in directory_users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    base_name TEXT;
    final_name TEXT;
    counter INTEGER := 0;
BEGIN
    base_name := COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
    final_name := base_name;

    WHILE EXISTS (SELECT 1 FROM public.directory_users WHERE name = final_name) LOOP
        counter := counter + 1;
        final_name := base_name || counter;
    END LOOP;

    INSERT INTO public.directory_users (id, name, role)
    VALUES (NEW.id, final_name, 'Owner')
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
