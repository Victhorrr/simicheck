-- Crear tabla sucursales
CREATE TABLE sucursales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  token_qr TEXT UNIQUE NOT NULL,
  latitud DOUBLE PRECISION NOT NULL,
  longitud DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla perfiles
CREATE TABLE perfiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol TEXT DEFAULT 'empleado' CHECK (rol IN ('admin', 'empleado')),
  sucursal_id UUID REFERENCES sucursales(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla asistencias
CREATE TABLE asistencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID REFERENCES perfiles(id) ON DELETE CASCADE NOT NULL,
  sucursal_id UUID REFERENCES sucursales(id) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  latitud DOUBLE PRECISION,
  longitud DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- Políticas para sucursales (solo admin puede ver/editar)
CREATE POLICY "Admin can manage sucursales" ON sucursales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.rol = 'admin'
    )
  );

-- Políticas para perfiles
CREATE POLICY "Users can view own profile" ON perfiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" ON perfiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.rol = 'admin'
    )
  );

CREATE POLICY "Users can update own profile" ON perfiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para asistencias
CREATE POLICY "Users can view own asistencias" ON asistencias
  FOR SELECT USING (
    empleado_id IN (
      SELECT id FROM perfiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own asistencias" ON asistencias
  FOR INSERT WITH CHECK (
    empleado_id IN (
      SELECT id FROM perfiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all asistencias" ON asistencias
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid() AND perfiles.rol = 'admin'
    )
  );

-- Trigger para insertar perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    CASE WHEN NEW.email = 'drhdogu@hotmail.com' THEN 'admin' ELSE 'empleado' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar REPLICA en asistencias y perfiles para realtime
ALTER PUBLICATION supabase_realtime ADD TABLE asistencias;
ALTER PUBLICATION supabase_realtime ADD TABLE perfiles;