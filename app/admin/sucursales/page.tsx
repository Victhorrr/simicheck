'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import AdminLayout from '@/components/AdminLayout'
import { Building2, Plus, Edit, Trash2, MapPin } from 'lucide-react'

interface Sucursal {
  id: string
  nombre: string
  token_qr: string
  latitud: number
  longitud: number
  created_at: string
}

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    latitud: '',
    longitud: ''
  })

  useEffect(() => {
    fetchSucursales()
  }, [])

  const fetchSucursales = async () => {
    const { data, error } = await supabase
      .from('sucursales')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Error al cargar sucursales')
      return
    }

    setSucursales(data || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.latitud || !formData.longitud) {
      toast.error('Todos los campos son requeridos')
      return
    }

    const lat = parseFloat(formData.latitud)
    const lng = parseFloat(formData.longitud)

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Coordenadas inválidas')
      return
    }

    try {
      if (editingSucursal) {
        const { error } = await supabase
          .from('sucursales')
          .update({
            nombre: formData.nombre,
            latitud: lat,
            longitud: lng
          })
          .eq('id', editingSucursal.id)

        if (error) throw error
        toast.success('Sucursal actualizada')
      } else {
        const { error } = await supabase
          .from('sucursales')
          .insert({
            nombre: formData.nombre,
            latitud: lat,
            longitud: lng,
            token_qr: crypto.randomUUID()
          })

        if (error) throw error
        toast.success('Sucursal creada')
      }

      setIsModalOpen(false)
      setEditingSucursal(null)
      setFormData({ nombre: '', latitud: '', longitud: '' })
      fetchSucursales()
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const handleEdit = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal)
    setFormData({
      nombre: sucursal.nombre,
      latitud: sucursal.latitud.toString(),
      longitud: sucursal.longitud.toString()
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta sucursal?')) return

    try {
      const { error } = await supabase
        .from('sucursales')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Sucursal eliminada')
      fetchSucursales()
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sucursales</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestiona las sucursales de tu empresa
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSucursal(null)
              setFormData({ nombre: '', latitud: '', longitud: '' })
              setIsModalOpen(true)
            }}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Sucursal
          </button>
        </div>

        {/* Sucursales Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sucursales.map((sucursal) => (
            <div
              key={sucursal.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {sucursal.nombre}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {sucursal.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-2" />
                  {sucursal.latitud.toFixed(6)}, {sucursal.longitud.toFixed(6)}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(sucursal)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(sucursal.id)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
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
                    Latitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitud}
                    onChange={(e) => setFormData({ ...formData, latitud: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Longitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitud}
                    onChange={(e) => setFormData({ ...formData, longitud: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
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
                    {editingSucursal ? 'Actualizar' : 'Crear'}
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