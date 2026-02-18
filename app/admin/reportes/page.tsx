'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import AdminLayout from '@/components/AdminLayout'
import { FileText, Download, Calendar, TrendingUp, Users, Clock, Building2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

interface ReportData {
  totalEmpleados: number
  totalAsistencias: number
  promedioDiario: number
  sucursalMasActiva: string
  asistenciasPorDia: { date: string; asistencias: number }[]
  asistenciasPorSucursal: { name: string; value: number }[]
  asistenciasPorEmpleado: { name: string; asistencias: number }[]
  retardosPorDia: { date: string; retardos: number }[]
}

export default function ReportesPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month') // 'week', 'month', '3months'

  useEffect(() => {
    generateReport()
  }, [dateRange])

  const getDateRange = () => {
    const now = new Date()
    switch (dateRange) {
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case '3months':
        return { start: subMonths(startOfMonth(now), 2), end: endOfMonth(now) }
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) }
    }
  }

  const generateReport = async () => {
    setIsLoading(true)
    const { start, end } = getDateRange()

    try {
      // Get all asistencias in date range
      const { data: asistencias, error: asistenciasError } = await supabase
        .from('asistencias')
        .select(`
          *,
          perfiles (nombre),
          sucursales (nombre)
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true })

      if (asistenciasError) throw asistenciasError

      // Get total employees
      const { data: empleados, error: empleadosError } = await supabase
        .from('perfiles')
        .select('id')

      if (empleadosError) throw empleadosError

      // Process data
      const asistenciasData = asistencias || []
      const totalEmpleados = empleados?.length || 0
      const totalAsistencias = asistenciasData.length

      // Calculate daily average
      const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      const promedioDiario = totalAsistencias / daysDiff

      // Find most active branch
      const sucursalCount: Record<string, number> = {}
      asistenciasData.forEach(a => {
        const sucursal = a.sucursales?.nombre || 'Sin sucursal'
        sucursalCount[sucursal] = (sucursalCount[sucursal] || 0) + 1
      })
      const sucursalMasActiva = Object.entries(sucursalCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

      // Daily asistencias
      const asistenciasPorDia: Record<string, number> = {}
      asistenciasData.forEach(a => {
        const date = format(new Date(a.created_at), 'yyyy-MM-dd')
        asistenciasPorDia[date] = (asistenciasPorDia[date] || 0) + 1
      })

      const asistenciasPorDiaArray = Object.entries(asistenciasPorDia)
        .map(([date, count]) => ({
          date: format(new Date(date), 'dd/MM', { locale: es }),
          asistencias: count
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Asistencias por sucursal
      const asistenciasPorSucursalArray = Object.entries(sucursalCount)
        .map(([sucursal, count]) => ({ name: sucursal, value: count }))
        .sort((a, b) => b.value - a.value)

      // Asistencias por empleado
      const empleadoCount: Record<string, number> = {}
      asistenciasData.forEach(a => {
        const empleado = a.perfiles?.nombre || 'Sin nombre'
        empleadoCount[empleado] = (empleadoCount[empleado] || 0) + 1
      })

      const asistenciasPorEmpleadoArray = Object.entries(empleadoCount)
        .map(([empleado, count]) => ({ name: empleado, asistencias: count }))
        .sort((a, b) => b.asistencias - a.asistencias)
        .slice(0, 10) // Top 10

      // Retardos por día (assuming 9 AM start time)
      const retardosPorDia: Record<string, number> = {}
      asistenciasData
        .filter(a => a.tipo === 'entrada')
        .forEach(a => {
          const asistenciaTime = new Date(a.created_at)
          const expectedTime = new Date(asistenciaTime)
          expectedTime.setHours(9, 0, 0, 0)

          if (asistenciaTime > expectedTime) {
            const date = format(asistenciaTime, 'yyyy-MM-dd')
            retardosPorDia[date] = (retardosPorDia[date] || 0) + 1
          }
        })

      const retardosPorDiaArray = Object.entries(retardosPorDia)
        .map(([date, count]) => ({
          date: format(new Date(date), 'dd/MM', { locale: es }),
          retardos: count
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setReportData({
        totalEmpleados,
        totalAsistencias,
        promedioDiario,
        sucursalMasActiva,
        asistenciasPorDia: asistenciasPorDiaArray,
        asistenciasPorSucursal: asistenciasPorSucursalArray,
        asistenciasPorEmpleado: asistenciasPorEmpleadoArray,
        retardosPorDia: retardosPorDiaArray
      })
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = () => {
    if (!reportData) return

    const report = {
      periodo: dateRange,
      fecha_generacion: new Date().toISOString(),
      ...reportData
    }

    const dataStr = JSON.stringify(report, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `reporte-asistencia-${format(new Date(), 'yyyy-MM-dd')}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!reportData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Error al cargar el reporte</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reportes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Análisis detallado de la asistencia
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="3months">Últimos 3 meses</option>
            </select>
            <button
              onClick={exportReport}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Exportar
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.totalEmpleados}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Asistencias</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.totalAsistencias}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio Diario</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.promedioDiario.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Building2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sucursal Más Activa</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{reportData.sucursalMasActiva}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Asistencias por Día */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Asistencias por Día
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.asistenciasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="asistencias" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Asistencias por Sucursal */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Asistencias por Sucursal
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.asistenciasPorSucursal}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.asistenciasPorSucursal.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Empleados */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 10 Empleados
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.asistenciasPorEmpleado} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#6B7280" />
                <YAxis dataKey="name" type="category" stroke="#6B7280" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="asistencias" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Retardos por Día */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Retardos por Día
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.retardosPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
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
                  dataKey="retardos"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}