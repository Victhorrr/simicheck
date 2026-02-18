# 🚀 Setup Final - Check-Simi

Tu aplicación está casi lista. Solo necesitas completar estos 3 pasos finales:

## ✅ Paso 1: Crear el Usuario Admin en Supabase

1. Ve a tu proyecto Supabase → **Authentication** → **Users**
2. Click en **"Invite User"** button
3. Email: `drhdogu@hotmail.com`
4. Deja la contraseña vacía o autogenera
5. **IMPORTANTE**: Marca "Auto confirm user"
6. Click **Send invite**

El usuario se creará automáticamente como **admin** gracias al trigger en la base de datos.

---

## ✅ Paso 2: Insertar Datos de Prueba (Sucursal)

1. Ve a Supabase → **SQL Editor**
2. Crea una nueva query
3. Copia y ejecuta esto:

```sql
INSERT INTO sucursales (nombre, token_qr, latitud, longitud)
VALUES (
  'Matriz Principal',
  gen_random_uuid()::text,
  4.7110,
  -74.0721
)
ON CONFLICT DO NOTHING;
```

> Las coordenadas (4.7110, -74.0721) son para Bogotá. Cambialas según tu ubicación.

4. Ejecuta la query
5. ✅ Sucursal creada!

---

## ✅ Paso 3: Verificar el Deploy en Vercel

1. Ve a https://vercel.com/victhorrrs-projects/check-simi/deployments
2. Espera a que el build termine (indica "Ready")
3. Haz click en el deployment para verlo en vivo

---

## 🎯 URLs de Acceso

- **Dashboard Admin**: https://check-simi.vercel.app/admin/dashboard
- **Check-in Empleado**: https://check-simi.vercel.app/marcar
- **Repositorio**: https://github.com/Victhorrr/simicheck

---

## 🔐 Credenciales de Prueba

- **Admin Email**: drhdogu@hotmail.com
- **Contraseña**: (la que estableciste en Supabase)

---

## 📍 Geofencing Setup

El sistema incluye validación de geofencing (100m radius) al hacer check-in con QR.
Las coordenadas GPS se obtienen del navegador automáticamente.

---

## 🎨 Features Incluidos

✅ Dashboard admin con Linear/Vercel design  
✅ Gestión de sucursales y empleados  
✅ QR Scanner de 30 FPS con detección de fraude  
✅ Reportes y analytics avanzados  
✅ Realtime updates con Supabase  
✅ Dark/Light mode  
✅ Mobile responsive  

---

**¡Listo! Tu aplicación está en producción.** 🚀
