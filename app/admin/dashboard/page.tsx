'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Asistencia {
  id: string
  empleado_id: string
  sucursal_id: string
  tipo: 'entrada' | 'salida'
  created_at: string
  perfiles: { nombre: string }
  sucursales: { nombre: string }
}

interface Sucursal {
  id: string
  nombre: string
  token_qr: string
}

interface EmpleadoEnSede {
  id: string
  nombre: string
  sucursal: string
  entrada: string
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [empleadosEnSede, setEmpleadosEnSede] = useState<EmpleadoEnSede[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setUser(null)
      setIsLoading(false)
      return
    }
    if (user.email !== 'drhdogu@hotmail.com') {
      toast.error('Acceso denegado')
      window.location.href = '/'
      return
    }
    setUser(user)
    fetchData()
    setupRealtime()
    setIsLoading(false)
  }

  const fetchData = async () => {
    // Fetch asistencias with joins
    const { data: asistenciasData, error: asistenciasError } = await supabase
      .from('asistencias')
      .select(`
        *,
        perfiles (nombre),
        sucursales (nombre)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (asistenciasError) {
      toast.error('Error al cargar asistencias')
      return
    }

    setAsistencias(asistenciasData || [])

    // Fetch sucursales
    const { data: sucursalesData, error: sucursalesError } = await supabase
      .from('sucursales')
      .select('*')

    if (sucursalesError) {
      toast.error('Error al cargar sucursales')
      return
    }

    setSucursales(sucursalesData || [])

    // Calculate empleados en sede
    calculateEmpleadosEnSede(asistenciasData || [])

    // Prepare chart data
    prepareChartData(asistenciasData || [])
  }

  const setupRealtime = () => {
    const channel = supabase
      .channel('asistencias_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias' }, (payload) => {
        fetchData()
      })
      .subscribe()
  }

  const calculateEmpleadosEnSede = (asistenciasData: Asistencia[]) => {
    const empleadosMap = new Map<string, EmpleadoEnSede>()

    asistenciasData.forEach(asistencia => {
      const empleadoId = asistencia.empleado_id
      const current = empleadosMap.get(empleadoId)

      if (!current || new Date(asistencia.created_at) > new Date(current.entrada)) {
        if (asistencia.tipo === 'entrada') {
          empleadosMap.set(empleadoId, {
            id: empleadoId,
            nombre: asistencia.perfiles.nombre,
            sucursal: asistencia.sucursales.nombre,
            entrada: asistencia.created_at,
          })
        } else {
          empleadosMap.delete(empleadoId)
        }
      }
    })

    setEmpleadosEnSede(Array.from(empleadosMap.values()))
  }

  const prepareChartData = (asistenciasData: Asistencia[]) => {
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      return format(date, 'yyyy-MM-dd')
    }).reverse()

    const data = last7Days.map(date => {
      const entradas = asistenciasData.filter(a =>
        a.tipo === 'entrada' && format(new Date(a.created_at), 'yyyy-MM-dd') === date
      ).length
      const salidas = asistenciasData.filter(a =>
        a.tipo === 'salida' && format(new Date(a.created_at), 'yyyy-MM-dd') === date
      ).length
      return { date: format(new Date(date), 'dd/MM', { locale: es }), entradas, salidas }
    })

    setChartData(data)
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
          <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión como Administrador</h1>
          <form onSubmit={async (e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            const email = formData.get('email') as string
            const password = formData.get('password') as string

            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
              toast.error('Error al iniciar sesión')
            } else {
              checkAdmin()
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Asistencias de Hoy</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="entradas" stroke="#8884d8" name="Entradas" />
              <Line type="monotone" dataKey="salidas" stroke="#82ca9d" name="Salidas" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Empleados Actualmente en Sede</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {empleadosEnSede.map(empleado => (
              <div key={empleado.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span>{empleado.nombre}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{empleado.sucursal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Generar Códigos QR por Sucursal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sucursales.map(sucursal => (
            <div key={sucursal.id} className="text-center">
              <h3 className="font-medium mb-2">{sucursal.nombre}</h3>
              <QRCodeSVG value={sucursal.token_qr} size={128} />
              <button
                onClick={() => downloadQR(sucursal)}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Descargar QR
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Últimas Asistencias</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-2 text-left">Empleado</th>
                <th className="px-4 py-2 text-left">Sucursal</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Fecha/Hora</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.slice(0, 20).map(asistencia => (
                <tr key={asistencia.id} className="border-t">
                  <td className="px-4 py-2">{asistencia.perfiles.nombre}</td>
                  <td className="px-4 py-2">{asistencia.sucursales.nombre}</td>
                  <td className="px-4 py-2 capitalize">{asistencia.tipo}</td>
                  <td className="px-4 py-2">{format(new Date(asistencia.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}