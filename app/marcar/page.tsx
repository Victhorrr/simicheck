'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import QRScanner from '@/components/QRScanner'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Asistencia {
  tipo: 'entrada' | 'salida'
  created_at: string
  sucursales: { nombre: string }[]
}

export default function MarcarPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [lastAsistencia, setLastAsistencia] = useState<Asistencia | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      fetchLastAsistencia(user.id)
    }
    setIsLoading(false)
  }

  const fetchLastAsistencia = async (userId: string) => {
    const { data, error } = await supabase
      .from('asistencias')
      .select(`
        tipo,
        created_at,
        sucursales!inner (nombre)
      `)
      .eq('empleado_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      toast.error('Error al cargar última asistencia')
      return
    }

    if (data) {
      setLastAsistencia(data as Asistencia)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>
          <form onSubmit={async (e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            const email = formData.get('email') as string
            const password = formData.get('password') as string

            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
              toast.error('Error al iniciar sesión')
            } else {
              window.location.reload()
            }
          }}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  const isInside = lastAsistencia?.tipo === 'entrada'

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Marcar Asistencia</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado Actual</h2>
          <div className={`text-center p-4 rounded-lg ${isInside ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
            <div className="text-2xl font-bold">
              {isInside ? 'Dentro de Sede' : 'Fuera de Sede'}
            </div>
            {lastAsistencia && (
              <div className="text-sm mt-2">
                Última {lastAsistencia.tipo}: {format(new Date(lastAsistencia.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                <br />
                Sucursal: {lastAsistencia.sucursales[0]?.nombre}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Escanear Código QR</h2>
          <QRScanner />
        </div>
      </div>
    </div>
  )
}