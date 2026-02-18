# 📱 Check-Simi - Sistema de Control de Asistencia

✅ **LIVE en Vercel** - Aplicación moderna de check-in/check-out con QR, geofencing y reportes en tiempo real. Diseño Linear/Vercel con dashboard administrativo completo.

## ✨ Características Principales

### 🎯 Dashboard Admin (Linear/Vercel Style)
- Sidebar colapsable con modo oscuro/claro
- BentoGrid para KPIs (Presentes, Retardos, Sucursal Más Activa)
- Tabla realtime con estados visuales (verde/ámbar) y animaciones
- Gráficos de tendencias con Recharts
- Generador de códigos QR con descarga PDF/PNG

### 📊 Páginas de Gestión
- **Sucursales**: CRUD completo con coordenadas GPS
- **Empleados**: Lista, edición y roles de usuarios
- **Reportes**: Analytics avanzado, filtros de fecha, exportación JSON

### 🔐 Control de Asistencia
- QR Scanner con alta velocidad (30 FPS)
- Validación de sucursal + GPS
- Geofencing (100m de radio)
- Anti-fraude (previene check-ins dobles)
- Realtime updates via Supabase

---

## 🚀 Guía de Deploy

### ⚙️ Paso 1: Supabase Setup (5 min)

1. Ir a https://supabase.com y crear proyecto
2. Copiar en SQL Editor el contenido de `schema.sql`
3. Ejecutar script
4. Crear usuario admin:
   - **Email**: `drhdogu@hotmail.com`
   - **Password**: `simicheck`
5. Copiar API keys de Settings → API

### 🔑 Paso 2: Variables de Entorno

Crear `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui
```

### 🌐 Paso 3: Deploy a Vercel

**Opción CLI (Recomendado)**:
```bash
npm install -g vercel
vercel
# Seguir instrucciones interactivas
```

**Opción Dashboard**:
1. https://vercel.com/dashboard
2. "Add New" → "Project" → Selectionar repositorio
3. Environment Variables → Añadir credenciales
4. "Deploy"

---

## 💻 Desarrollo Local

```bash
npm install
npm run dev
# http://localhost:3000
```

## 📚 Rutas

- `/` - Landing
- `/marcar` - Check-in/out empleados
- `/admin/dashboard` - Dashboard
- `/admin/sucursales` - Gestión sucursales
- `/admin/empleados` - Gestión empleados
- `/admin/reportes` - Reportes
- Cuenta en [Supabase](https://supabase.com)

## 🔧 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd check-simi
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
   ```

4. **Configura Supabase**
   - Crea un nuevo proyecto en Supabase
   - Ejecuta el contenido del archivo `schema.sql` en el SQL Editor
   - Configura la autenticación (opcional: proveedores sociales)

## 🚀 Uso

### Desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Producción
```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
check-simi/
├── app/
│   ├── admin/dashboard/     # Dashboard administrativo
│   ├── marcar/             # Página de marcado de asistencia
│   ├── layout.tsx          # Layout principal
│   └── page.tsx            # Página de inicio
├── components/
│   └── QRScanner.tsx       # Componente de escaneo QR
├── lib/
│   └── supabase.ts         # Cliente de Supabase
├── public/
│   └── manifest.json       # Manifiesto PWA
├── schema.sql              # Esquema de base de datos
├── PASOS_FINALES.md        # Guía de configuración
└── README.md
```

## 🔐 Configuración de Usuarios

### Usuario Administrador
- Email: `drhdogu@hotmail.com`
- Password: `simicheck` (para desarrollo)
- Rol: `admin` (asignado automáticamente)

### Empleados
- Rol: `empleado` (por defecto)
- Acceso limitado a marcar asistencia

## 📊 Funcionalidades

### Para Administradores
- Visualizar estadísticas en tiempo real
- Generar códigos QR para sucursales
- Ver lista de empleados actualmente en sede
- Gestionar sucursales y empleados

### Para Empleados
- Iniciar sesión
- Escanear códigos QR para marcar entrada/salida
- Ver estado actual (dentro/fuera de sede)
- Historial de asistencias

## 🌐 PWA (Progressive Web App)

La aplicación se puede instalar en dispositivos móviles:
1. Abre la app en un navegador móvil
2. Selecciona "Agregar a pantalla de inicio"
3. La app funcionará como una aplicación nativa

## 🔒 Seguridad

- **Row Level Security (RLS)**: Políticas de seguridad a nivel de fila en Supabase
- **Autenticación**: Sistema de login seguro
- **Geofencing**: Validación de ubicación GPS
- **Validación QR**: Tokens únicos por sucursal

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa la guía en `PASOS_FINALES.md`
2. Verifica la configuración de Supabase
3. Asegúrate de que el navegador permita acceso a la cámara y GPS

---

Desarrollado con ❤️ usando Next.js y Supabase
