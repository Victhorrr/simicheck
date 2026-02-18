-- Crear tabla sucursales
CREATE TABLE IF NOT EXISTS sucursales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  token_qr TEXT UNIQUE NOT NULL,
  latitud DOUBLE PRECISION NOT NULL,
  longitud DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla perfiles
CREATE TABLE IF NOT EXISTS perfiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol TEXT DEFAULT 'empleado' CHECK (rol IN ('admin', 'empleado')),
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla asistencias
CREATE TABLE IF NOT EXISTS asistencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  latitud DOUBLE PRECISION,
  longitud DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage sucursales" ON sucursales;
DROP POLICY IF EXISTS "Users can view own profile" ON perfiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON perfiles;
DROP POLICY IF EXISTS "Users can update own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can view own asistencias" ON asistencias;
DROP POLICY IF EXISTS "Users can insert own asistencias" ON asistencias;
DROP POLICY IF EXISTS "Admin can view all asistencias" ON asistencias;
DROP POLICY IF EXISTS "Admin insert asistencias" ON asistencias;
DROP POLICY IF EXISTS "Public can view sucursales" ON sucursales;
DROP POLICY IF EXISTS "Admin update sucursales" ON sucursales;
DROP POLICY IF EXISTS "Admin delete sucursales" ON sucursales;
DROP POLICY IF EXISTS "Public view perfiles" ON perfiles;
DROP POLICY IF EXISTS "Admin manage perfiles" ON perfiles;

-- Políticas para sucursales - PERMISO TOTAL PARA ADMIN
CREATE POLICY "Public can view sucursales" ON sucursales
  FOR SELECT USING (true);

CREATE POLICY "Admin insert sucursales" ON sucursales
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Admin update sucursales" ON sucursales
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Admin delete sucursales" ON sucursales
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Políticas para perfiles
CREATE POLICY "Public view perfiles" ON perfiles
  FOR SELECT USING (true);

CREATE POLICY "Admin manage perfiles" ON perfiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Users update own profile" ON perfiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para asistencias
CREATE POLICY "Users can view own asistencias" ON asistencias
  FOR SELECT USING (empleado_id = auth.uid() OR EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "Users can insert own asistencias" ON asistencias
  FOR INSERT WITH CHECK (empleado_id = auth.uid());

CREATE POLICY "Admin insert asistencias" ON asistencias
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "Admin can view all asistencias" ON asistencias
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger para insertar perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    CASE 
      WHEN NEW.email = 'drhdogu@hotmail.com' THEN 'admin'
      ELSE 'empleado'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar REPLICA en asistencias y perfiles para realtime
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE asistencias;
EXCEPTION WHEN others THEN 
  NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE perfiles;
EXCEPTION WHEN others THEN 
  NULL;
END $$;