import Link from 'next/link'
import { Lock, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Check-Simi
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Sistema de Control de Asistencia
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Admin Panel */}
          <Link
            href="/admin/login"
            className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-8"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Panel Administrativo
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Acceso para administradores. Gestiona sucursales, empleados y reportes.
            </p>
            <div className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium group-hover:bg-blue-700 transition-colors">
              Inicia Sesión →
            </div>
          </Link>

          {/* Employee Check-in */}
          <Link
            href="/marcar"
            className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-8"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Marcar Asistencia
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Escanea tu código QR o inicia sesión para registrar tu asistencia.
            </p>
            <div className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium group-hover:bg-green-700 transition-colors">
              Continuar →
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            v1.0 • Attendance Control System
          </p>
        </div>
      </div>
    </div>
  )
}
