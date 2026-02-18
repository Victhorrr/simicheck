# Control de Asistencia Multi-Sucursal

Una aplicación web progresiva (PWA) para el control de asistencia de empleados en múltiples sucursales, utilizando geolocalización y códigos QR.

## 🚀 Características

- **Control de Asistencia**: Registro de entrada/salida mediante escaneo de códigos QR
- **Geolocalización**: Validación de ubicación GPS para asegurar que el empleado esté en la sucursal
- **Dashboard Administrativo**: Panel en tiempo real con gráficos y estadísticas
- **Aplicación Móvil**: Optimizada para dispositivos móviles con interfaz táctil
- **Autenticación**: Sistema de login seguro con roles (admin/empleado)
- **Tiempo Real**: Actualizaciones en vivo del estado de asistencia
- **PWA**: Instalable en dispositivos móviles y funciona sin conexión

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Librerías**:
  - `html5-qrcode` - Escaneo de códigos QR
  - `recharts` - Gráficos y visualizaciones
  - `qrcode.react` - Generación de códigos QR
  - `sonner` - Notificaciones toast
  - `date-fns` - Manejo de fechas
  - `lucide-react` - Iconos

## 📋 Prerrequisitos

- Node.js 18+
- npm o yarn
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
