# 🔧 ARREGLA TODO AHORA - 3 PASOS

## ✅ Paso 1: Ejecutar SQL en Supabase

1. Abre: https://supabase.com/dashboard
2. Click en **SQL Editor** → **New Query**
3. Abre el archivo: `SQL_SETUP.sql` de este repositorio
4. **Copia TODO el contenido**
5. **Pega en Supabase SQL Editor**
6. Click **Run** (o Ctrl+Enter)

**Espera a que termine sin errores** ✅

---

## ✅ Paso 2: Espera 30 segundos

Supabase necesita actualizar las políticas RLS. Espera mientras tomas un café ☕

---

## ✅ Paso 3: Prueba la APP

Ve a: https://check-simi.vercel.app/admin/dashboard

Verifica que funcione:
- ✅ **Menú lateral** - Click para cambiar de página
- ✅ **Sucursales** - Botón "Nueva Sucursal" y CRUD
- ✅ **Empleados** - Lista de empleados y edición  
- ✅ **Reportes** - Gráficos en tiempo real
- ✅ **Check-in** - https://check-simi.vercel.app/marcar

---

## 🆘 SI ALGO NO FUNCIONA

### Error "relation doesn't exist"
→ Vuelve a ejecutar todo el SQL en Supabase (Paso 1)

### Menú lateral no responde
→ Recarga la página (F5 o Cmd+R)

### Botones no hacen nada
→ Abre la consola (F12) y busca errores rojos

### Videos/Screenshots no carga
→ Probablemente es tu navegador. Intenta otro navegador.

---

## 📞 INFORMACIÓN

- **App LIVE**: https://check-simi.vercel.app
- **Repo**: https://github.com/Victhorrr/simicheck
- **Admin**: drhdogu@hotmail.com
- **SQL File**: `SQL_SETUP.sql`

---

## ✨ RESUMEN DE CAMBIOS HECHOS

1. **Menú lateral mejorado** - Ahora muestra qué página está activa
2. **RLS Policies simplificadas** - Admin puede hacer CRUD de todo
3. **SQL script limpio** - Fácil de copiar y pegar
4. **Test data incluido** - Ya viene con 1 sucursal

---

**Ejecuta el SQL y todo debe funcionar perfectamente.** 🚀
