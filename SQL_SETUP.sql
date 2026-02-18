-- ============================================
-- CHECK-SIMI DATABASE SETUP - EXECUTE THIS NOW
-- ============================================
-- Copy ALL of this and paste into Supabase SQL Editor

-- STEP 1: Clean slate (drop existing objects)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS asistencias CASCADE;
DROP TABLE IF EXISTS perfiles CASCADE;
DROP TABLE IF EXISTS sucursales CASCADE;

-- STEP 2: Create tables
CREATE TABLE sucursales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  token_qr TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  latitud DOUBLE PRECISION NOT NULL DEFAULT 4.7110,
  longitud DOUBLE PRECISION NOT NULL DEFAULT -74.0721,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT DEFAULT 'empleado' CHECK (rol IN ('admin', 'empleado')),
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asistencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  latitud DOUBLE PRECISION,
  longitud DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Enable RLS
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create simplified RLS policies
-- SUCURSALES - Everyone can READ, only ADMIN can WRITE
CREATE POLICY "allow_read_sucursales" ON sucursales FOR SELECT USING (true);
CREATE POLICY "allow_insert_sucursales" ON sucursales FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM perfiles WHERE rol = 'admin')
);
CREATE POLICY "allow_update_sucursales" ON sucursales FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM perfiles WHERE rol = 'admin')
);
CREATE POLICY "allow_delete_sucursales" ON sucursales FOR DELETE USING (
  auth.uid() IN (SELECT id FROM perfiles WHERE rol = 'admin')
);

-- PERFILES - Everyone can READ, ADMIN can manage all, users can update own
CREATE POLICY "allow_read_perfiles" ON perfiles FOR SELECT USING (true);
CREATE POLICY "allow_admin_manage_perfiles" ON perfiles FOR ALL USING (
  auth.uid() IN (SELECT id FROM perfiles WHERE rol = 'admin')
);
CREATE POLICY "allow_update_own_profile" ON perfiles FOR UPDATE USING (auth.uid() = id);

-- ASISTENCIAS - Users see own, ADMIN sees all
CREATE POLICY "allow_read_own_asistencias" ON asistencias FOR SELECT USING (
  empleado_id = auth.uid() OR 
  auth.uid() IN (SELECT id FROM perfiles WHERE rol = 'admin')
);
CREATE POLICY "allow_insert_own_asistencias" ON asistencias FOR INSERT WITH CHECK (
  empleado_id = auth.uid()
);
CREATE POLICY "allow_admin_insert_asistencias" ON asistencias FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM perfiles WHERE rol = 'admin')
);

-- STEP 5: Create trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuario'),
    CASE WHEN NEW.email = 'drhdogu@hotmail.com' THEN 'admin' ELSE 'empleado' END
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sucursales;
ALTER PUBLICATION supabase_realtime ADD TABLE perfiles;
ALTER PUBLICATION supabase_realtime ADD TABLE asistencias;

-- STEP 7: Insert test data
INSERT INTO sucursales (nombre, latitud, longitud) 
VALUES ('Matriz Principal', 4.7110, -74.0721)
ON CONFLICT DO NOTHING;

-- ============================================
-- THAT'S IT! All done. Now test the app.
-- ============================================
