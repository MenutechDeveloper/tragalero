-- SQL Setup for Tragalero Directory
-- This script recreates the schema and implements RLS policies for the new Supabase project.

-- 1. Create the directory_users table (linking to Supabase Auth)
CREATE TABLE IF NOT EXISTS directory_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'Owner' CHECK (role IN ('Owner', 'Admin')),
    is_active BOOLEAN DEFAULT TRUE,
    max_businesses INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the businesses table
CREATE TABLE IF NOT EXISTS businesses (
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
    owner_id UUID REFERENCES directory_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create the bento_grid table
CREATE TABLE IF NOT EXISTS bento_grid (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES directory_users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    link_url TEXT,
    col_span INTEGER DEFAULT 1,
    row_span INTEGER DEFAULT 1,
    bg_color TEXT DEFAULT '#dcf0fa',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE directory_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bento_grid ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for directory_users
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

-- 6. RLS Policies for directory_users
DROP POLICY IF EXISTS "Users can view their own profile" ON directory_users;
CREATE POLICY "Users can view their own profile" ON directory_users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins have full access to directory_users" ON directory_users;
CREATE POLICY "Admins have full access to directory_users" ON directory_users
    FOR ALL USING (public.check_is_admin());

-- 7. RLS Policies for businesses
DROP POLICY IF EXISTS "Anyone can view visible businesses" ON businesses;
CREATE POLICY "Anyone can view visible businesses" ON businesses
    FOR SELECT USING (is_visible = TRUE);

DROP POLICY IF EXISTS "Owners can view their own businesses" ON businesses;
CREATE POLICY "Owners can view their own businesses" ON businesses
    FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can manage their own businesses" ON businesses;
CREATE POLICY "Owners can manage their own businesses" ON businesses
    FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins have full access to businesses" ON businesses;
CREATE POLICY "Admins have full access to businesses" ON businesses
    FOR ALL USING (public.check_is_admin());

-- 8. RLS Policies for bento_grid
DROP POLICY IF EXISTS "Users can manage their own bento grid" ON bento_grid;
CREATE POLICY "Users can manage their own bento grid" ON bento_grid
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to bento_grid" ON bento_grid;
CREATE POLICY "Admins have full access to bento_grid" ON bento_grid
    FOR ALL USING (public.check_is_admin());

-- 9. Trigger to automatically create a profile in directory_users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.directory_users (id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', NEW.email),
        'Owner'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- NOTE: To set an admin, manually update the role column in directory_users.
-- UPDATE directory_users SET role = 'Admin' WHERE name = 'YourAdminName';
