'use client'

import { useEffect, useState } from 'react'
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

interface RealtimeTableProps {
  asistencias: Asistencia[]
  newRecordIds: string[]
}

export default function RealtimeTable({ asistencias, newRecordIds }: RealtimeTableProps) {
  const [blinkingRows, setBlinkingRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (newRecordIds.length > 0) {
      setBlinkingRows(new Set(newRecordIds))
      const timer = setTimeout(() => {
        setBlinkingRows(new Set())
      }, 3000) // Stop blinking after 3 seconds
      return () => clearTimeout(timer)
    }
  }, [newRecordIds])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Registros Recientes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Sucursal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Fecha/Hora
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {asistencias.slice(0, 10).map((asistencia) => (
              <tr
                key={asistencia.id}
                className={`transition-all duration-300 ${
                  blinkingRows.has(asistencia.id)
                    ? 'bg-green-50 dark:bg-green-900/20 animate-pulse'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {asistencia.perfiles.nombre}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-300">
                    {asistencia.sucursales.nombre}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    asistencia.tipo === 'entrada'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  }`}>
                    {asistencia.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {format(new Date(asistencia.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}