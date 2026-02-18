'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import AdminLayout from '@/components/AdminLayout'
import StatCard from '@/components/StatCard'
import BentoGrid from '@/components/BentoGrid'
import RealtimeTable from '@/components/RealtimeTable'
import QRGenerator from '@/components/QRGenerator'
import {
  Users,
  Clock,
  TrendingUp,
  Building2,
  Activity,
  Timer,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

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
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [empleadosEnSede, setEmpleadosEnSede] = useState<EmpleadoEnSede[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [newRecordIds, setNewRecordIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
    setupRealtime()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)

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
      console.error('Error fetching asistencias:', asistenciasError)
      setIsLoading(false)
      return
    }

    setAsistencias(asistenciasData || [])

    // Fetch sucursales
    const { data: sucursalesData, error: sucursalesError } = await supabase
      .from('sucursales')
      .select('*')

    if (sucursalesError) {
      console.error('Error fetching sucursales:', sucursalesError)
    } else {
      setSucursales(sucursalesData || [])
    }

    // Calculate empleados en sede
    calculateEmpleadosEnSede(asistenciasData || [])

    // Prepare chart data
    prepareChartData(asistenciasData || [])

    setIsLoading(false)
  }

  const setupRealtime = () => {
    const channel = supabase
      .channel('asistencias_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          setNewRecordIds(prev => [...prev, (payload.new as any).id])
          fetchData() // Refresh data
        } else {
          fetchData() // Refresh data for updates/deletes
        }
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

  // Calculate KPIs
  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)

  const todayAsistencias = asistencias.filter(a => {
    const asistenciaDate = new Date(a.created_at)
    return asistenciaDate >= todayStart && asistenciaDate <= todayEnd
  })

  const totalPresentes = empleadosEnSede.length
  const retardosHoy = todayAsistencias.filter(a => {
    const asistenciaTime = new Date(a.created_at)
    const expectedTime = new Date(asistenciaTime)
    expectedTime.setHours(9, 0, 0, 0) // Assuming 9 AM start time
    return a.tipo === 'entrada' && asistenciaTime > expectedTime
  }).length

  const sucursalMasActiva = asistencias.reduce((acc, curr) => {
    acc[curr.sucursales.nombre] = (acc[curr.sucursales.nombre] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sucursalTop = Object.entries(sucursalMasActiva).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

  // Calculate trends (comparing with yesterday)
  const yesterday = subDays(today, 1)
  const yesterdayStart = startOfDay(yesterday)
  const yesterdayEnd = endOfDay(yesterday)

  const yesterdayAsistencias = asistencias.filter(a => {
    const asistenciaDate = new Date(a.created_at)
    return asistenciaDate >= yesterdayStart && asistenciaDate <= yesterdayEnd
  })

  const trendPresentes = totalPresentes - yesterdayAsistencias.filter(a => a.tipo === 'entrada').length
  const trendRetardos = retardosHoy - yesterdayAsistencias.filter(a => {
    const asistenciaTime = new Date(a.created_at)
    const expectedTime = new Date(asistenciaTime)
    expectedTime.setHours(9, 0, 0, 0)
    return a.tipo === 'entrada' && asistenciaTime > expectedTime
  }).length

  const bentoItems: {
    id: string
    content: React.ReactNode
    size: 'small' | 'medium' | 'large'
    colSpan?: number
  }[] = [
    {
      id: 'presentes',
      content: (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Presentes Hoy</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {totalPresentes}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className={`h-4 w-4 ${trendPresentes >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ${trendPresentes >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trendPresentes > 0 ? '+' : ''}{trendPresentes} vs ayer
            </span>
          </div>
        </div>
      ),
      size: 'medium'
    },
    {
      id: 'retardos',
      content: (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Timer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Retardos Hoy</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {retardosHoy}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className={`h-4 w-4 ${trendRetardos <= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ${trendRetardos <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trendRetardos > 0 ? '+' : ''}{trendRetardos} vs ayer
            </span>
          </div>
        </div>
      ),
      size: 'medium'
    },
    {
      id: 'sucursal-activa',
      content: (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sucursal Más Activa</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {sucursalTop}
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {sucursalMasActiva[sucursalTop] || 0} registros hoy
          </div>
        </div>
      ),
      size: 'medium'
    },
    {
      id: 'chart',
      content: (
        <div className="h-full">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tendencia Semanal</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line
                type="monotone"
                dataKey="entradas"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                name="Entradas"
              />
              <Line
                type="monotone"
                dataKey="salidas"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                name="Salidas"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ),
      size: 'large',
      colSpan: 2
    }
  ]

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitorea la asistencia y actividad en tiempo real
          </p>
        </div>

        {/* Bento Grid */}
        <BentoGrid items={bentoItems} />

        {/* Realtime Table */}
        <RealtimeTable asistencias={asistencias} newRecordIds={newRecordIds} />

        {/* QR Generator */}
        <QRGenerator />
      </div>
    </AdminLayout>
  )
}