# Pasos Finales para Configurar la Aplicación

## 1. Configurar Supabase
- Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto.
- Copia las credenciales:
  - URL del proyecto
  - Clave anónima (anon key)
- Pega estas credenciales en el archivo `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
  NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui
  ```

## 2. Ejecutar el Script SQL
- En el panel de Supabase, ve a la sección "SQL Editor".
- Copia y pega el contenido completo del archivo `schema.sql`.
- Ejecuta el script para crear las tablas, políticas RLS, trigger y habilitar realtime.

## 3. Crear Usuario Administrador
- Ve al Dashboard de Supabase > Authentication > Users
- Haz clic en "Add user"
- **Email**: `drhdogu@hotmail.com`
- **Password**: `simicheck`
- Marca "Auto confirm user" (recomendado para desarrollo)
- El sistema automáticamente asignará el rol de administrador a este usuario.

## 4. Ejecutar la Aplicación
- Ejecuta `npm run dev` en la terminal.
- Abre la aplicación en tu navegador.
- Para probar como administrador, inicia sesión con `drhdogu@hotmail.com`.
- Para marcar asistencia, ve a `/marcar` e inicia sesión con cualquier usuario registrado.

## 5. Configurar Sucursales
- Como administrador, puedes agregar sucursales directamente en la base de datos de Supabase.
- Asegúrate de generar tokens QR únicos para cada sucursal.

## Notas
- La aplicación es una PWA, por lo que se puede instalar en dispositivos móviles.
- Asegúrate de que el navegador permita acceso a la ubicación GPS para el geofencing.
- Los códigos QR se generan en el dashboard administrativo y se pueden descargar.