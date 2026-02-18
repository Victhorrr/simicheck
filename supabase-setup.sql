-- Script SQL para Supabase - Configuración automática de perfiles de empleados
-- Ejecutar en el SQL Editor de Supabase

-- 1. Función que se ejecuta al detectar un nuevo usuario en Auth
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

-- 2. Trigger que activa la función anterior automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Insertar sucursal de ejemplo (modificar coordenadas según tu ubicación real)
INSERT INTO public.sucursales (nombre, token_qr, latitud, longitud)
VALUES ('Sucursal Principal', 'sucursal-principal-123', 19.4326, -99.1332)
ON CONFLICT (token_qr) DO NOTHING;

-- 4. Habilitar Realtime para actualizaciones en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE asistencias;
ALTER PUBLICATION supabase_realtime ADD TABLE perfiles;

-- INSTRUCCIONES PARA CREAR EL USUARIO ADMIN:
-- 1. Ve al Dashboard de Supabase > Authentication > Users
-- 2. Haz clic en "Add user"
-- 3. Email: drhdogu@hotmail.com
-- 4. Password: simicheck
-- 5. Marca "Auto confirm user" si es para desarrollo
-- 6. El trigger automáticamente asignará el rol 'admin' a este usuario