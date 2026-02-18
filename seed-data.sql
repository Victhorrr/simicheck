-- Insertar sucursal de prueba
INSERT INTO sucursales (nombre, token_qr, latitud, longitud)
VALUES (
  'Matriz Principal',
  gen_random_uuid()::text,
  4.7110,  -- Bogotá latitude
  -74.0721  -- Bogotá longitude
)
ON CONFLICT DO NOTHING;

-- Crear perfil para el admin (si aún no existe)
INSERT INTO perfiles (id, nombre, rol)
VALUES (
  'c3c94b70-4466-42bc-b839-8d4ec1b0fd1a'::uuid,
  'Administrador',
  'admin'
)
ON CONFLICT (id) DO NOTHING;

-- Verificar datos
SELECT 'Sucursales:' as check, COUNT(*) FROM sucursales;
SELECT 'Perfiles:' as check, COUNT(*) FROM perfiles;

