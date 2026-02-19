'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AdminLayout from '@/components/AdminLayout'
import { Users, UserPlus, Edit, Trash2, Building2 } from 'lucide-react'

interface Empleado {
  id: string
  nombre: string
  rol: 'admin' | 'empleado'
  sucursal_id: string | null
  sucursales?: { nombre: string } | null
  created_at: string
}

interface Sucursal {
  id: string
  nombre: string
}

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    rol: 'empleado' as 'admin' | 'empleado',
    sucursal_id: ''
  })

  useEffect(() => {
    fetchEmpleados()
    fetchSucursales()
  }, [])

  const fetchEmpleados = async () => {
    try {
      const { data: empleadosData, error: empleadosError } = await supabase
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (empleadosError) throw empleadosError

      // Get sucursales separately
      const { data: sucursalesData, error: sucursalesError } = await supabase
        .from('sucursales')
        .select('id, nombre')

      if (sucursalesError) throw sucursalesError

      // Join manually
      const empleadosConSucursal = empleadosData?.map((emp: Empleado) => ({
        ...emp,
        sucursales: emp.sucursal_id
          ? sucursalesData?.find(s => s.id === emp.sucursal_id)
          : null
      })) || []

      setEmpleados(empleadosConSucursal)
      setIsLoading(false)
    } catch (error) {
      toast.error('Error al cargar empleados')
      console.error(error)
      setIsLoading(false)
    }
  }

  const fetchSucursales = async () => {
    const { data, error } = await supabase
      .from('sucursales')
      .select('id, nombre')
      .order('nombre')

    if (error) {
      toast.error('Error al cargar sucursales')
      return
    }

    setSucursales(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre) {
      toast.error('El nombre es requerido')
      return
    }

    try {
      if (editingEmpleado) {
        const { error } = await supabase
          .from('perfiles')
          .update({
            nombre: formData.nombre,
            rol: formData.rol,
            sucursal_id: formData.sucursal_id || null
          })
          .eq('id', editingEmpleado.id)

        if (error) throw error
        toast.success('Empleado actualizado')
      } else {
        // For new employees, we'd need to create auth users, but for now we'll skip this
        toast.error('La creación de nuevos empleados requiere configuración adicional')
        return
      }

      setIsModalOpen(false)
      setEditingEmpleado(null)
      setFormData({ nombre: '', rol: 'empleado', sucursal_id: '' })
      fetchEmpleados()
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const handleEdit = (empleado: Empleado) => {
    setEditingEmpleado(empleado)
    setFormData({
      nombre: empleado.nombre,
      rol: empleado.rol,
      sucursal_id: empleado.sucursal_id || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este empleado? Esta acción no se puede deshacer.')) return

    try {
      const { error } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Empleado eliminado')
      fetchEmpleados()
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Empleados</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestiona los empleados de tu empresa
            </p>
          </div>
        </div>

        {/* Empleados List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lista de Empleados
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sucursal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {empleados.map((empleado) => (
                  <tr key={empleado.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {empleado.nombre}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {empleado.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        empleado.rol === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {empleado.rol === 'admin' ? 'Administrador' : 'Empleado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        {empleado.sucursales ? (
                          <>
                            <Building2 className="h-4 w-4 mr-2" />
                            {empleado.sucursales.nombre}
                          </>
                        ) : (
                          <span className="text-gray-400">Sin asignar</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(empleado)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(empleado.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rol
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as 'admin' | 'empleado' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="empleado">Empleado</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sucursal
                  </label>
                  <select
                    value={formData.sucursal_id}
                    onChange={(e) => setFormData({ ...formData, sucursal_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Sin asignar</option>
                    {sucursales.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingEmpleado ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}