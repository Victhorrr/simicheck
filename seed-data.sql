-- Insertar sucursal de prueba
INSERT INTO sucursales (nombre, token_qr, latitud, longitud)
VALUES (
  'Matriz Principal',
  gen_random_uuid()::text,
  40.7128,  -- New York latitude (example)
  -74.0060  -- New York longitude (example)
)
ON CONFLICT DO NOTHING;

-- Verificar que se insertó
SELECT id, nombre, token_qr, latitud, longitud FROM sucursales LIMIT 1;
