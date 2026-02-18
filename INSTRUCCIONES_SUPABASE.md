# 🔧 INSTRUCCIONES FINALES - Ejecutar en Supabase

## Paso 1: Ir a Supabase SQL Editor

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard
2. Click en **SQL Editor** (en el menú izquierdo)
3. Click en **New Query**

---

## Paso 2: Copiar el Schema Actualizado

El schema actualizado está en:
**https://github.com/Victhorrr/simicheck/blob/main/schema.sql**

Opción A - Copiar desde GitHub:
1. Abre el link anterior
2. Click en el botón de copiar (arriba a la derecha del código)
3. Pega en el SQL Editor de Supabase

Opción B - Usar el SQL aquí:

```sql
-- Drop everything first (clean slate)
DROP TABLE IF EXISTS asistencias;
DROP TABLE IF EXISTS perfiles;
DROP TABLE IF EXISTS sucursales;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

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
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla asistencias
CREATE TABLE asistencias (
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

-- Políticas para sucursales
CREATE POLICY "Public can view sucursales" ON sucursales FOR SELECT USING (true);
CREATE POLICY "Admin insert sucursales" ON sucursales FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "Admin update sucursales" ON sucursales FOR UPDATE USING (
  EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "Admin delete sucursales" ON sucursales FOR DELETE USING (
  EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);

-- Políticas para perfiles
CREATE POLICY "Public view perfiles" ON perfiles FOR SELECT USING (true);
CREATE POLICY "Admin manage perfiles" ON perfiles FOR ALL USING (
  EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "Users update own profile" ON perfiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para asistencias
CREATE POLICY "Users can view own asistencias" ON asistencias FOR SELECT USING (
  empleado_id = auth.uid() OR EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);
CREATE POLICY "Users can insert own asistencias" ON asistencias FOR INSERT WITH CHECK (empleado_id = auth.uid());
CREATE POLICY "Admin insert asistencias" ON asistencias FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);

-- Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    CASE WHEN NEW.email = 'drhdogu@hotmail.com' THEN 'admin' ELSE 'empleado' END
  )
  ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, rol = EXCLUDED.rol;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE asistencias;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE perfiles;
EXCEPTION WHEN others THEN NULL; END $$;
```

---

## Paso 3: Ejecutar el SQL

1. **Selecciona TODO el código** en el SQL Editor (Ctrl+A)
2. Click en el botón **Run** (o Ctrl+Enter)
3. Espera a que se ejecute (debería tardar 5-10 segundos)
4. Verifica que no haya errores en la consola

---

## Paso 4: Verificar que Funcionó

1. Ve a **Table Editor** en Supabase
2. Deberías ver 3 tablas:
   - ✅ `sucursales`
   - ✅ `perfiles`
   - ✅ `asistencias`

3. Haz click en cada tabla para verificar:
   - ✅ Tiene datos o está vacía correctamente
   - ✅ Las columnas son las correctas

---

## Paso 5: Verificar la Aplicación

Una vez que ejecutes el SQL:

1. Ve a: https://check-simi.vercel.app/admin/dashboard
2. Inicia sesión con: `drhdogu@hotmail.com`
3. Verifica que puedas:
   - ✅ Ver el dashboard
   - ✅ Hacer click en "Sucursales" y crear una nueva
   - ✅ Hacer click en "Empleados" y ver la lista
   - ✅ Hacer click en "Reportes" y ver gráficos

---

## 🚨 Si hay errores:

**Error: "relation already exists"**
→ Esto es normal si ejecutas el SQL 2 veces
→ Usa la versión con `DROP TABLE IF EXISTS` (Opción B arriba)

**Error: "policies already exist"**
→ Normal también, el SQL las elimina primero

**Error de permisos en app**
→ Espera 30 segundos y recarga la página
→ Los cambios en RLS pueden tardar un poco

---

## ✅ MÁS INFORMACIÓN

- Repo: https://github.com/Victhorrr/simicheck
- App: https://check-simi.vercel.app
- Admin UUID: `c3c94b70-4466-42bc-b839-8d4ec1b0fd1a`

¡Listo! Ahora la app debería funcionar perfectamente. 🎉
