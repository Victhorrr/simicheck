import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Control de Asistencia</h1>
        <div className="space-y-4">
          <Link
            href="/admin/dashboard"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg text-center hover:bg-blue-700 transition-colors"
          >
            Panel Administrativo
          </Link>
          <Link
            href="/marcar"
            className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg text-center hover:bg-green-700 transition-colors"
          >
            Marcar Asistencia
          </Link>
        </div>
      </div>
    </div>
  )
}
