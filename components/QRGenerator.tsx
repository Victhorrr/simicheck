'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Download, QrCode, Building2 } from 'lucide-react'

interface Sucursal {
  id: string
  nombre: string
  token_qr: string
}

export default function QRGenerator() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [selectedSucursal, setSelectedSucursal] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchSucursales = async () => {
    const { data, error } = await supabase
      .from('sucursales')
      .select('id, nombre, token_qr')
      .order('nombre')

    if (error) {
      toast.error('Error al cargar sucursales')
      return
    }

    setSucursales(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchSucursales()
  }, [])

  const downloadQR = async (sucursal: Sucursal) => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size
      const size = 400
      canvas.width = size
      canvas.height = size + 80 // Extra space for text

      // Fill background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Create QR code as image
      const qrCanvas = document.createElement('canvas')
      const qrCtx = qrCanvas.getContext('2d')
      if (!qrCtx) return

      // Generate QR code data URL
      const qrDataUrl = `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
          <rect width="300" height="300" fill="white"/>
          ${document.querySelector(`#qr-${sucursal.id}`)?.outerHTML || ''}
        </svg>
      `)}`

      const qrImg = new Image()
      qrImg.onload = () => {
        // Draw QR code
        ctx.drawImage(qrImg, 50, 20, 300, 300)

        // Add text
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(sucursal.nombre, canvas.width / 2, 350)

        ctx.font = '12px Arial'
        ctx.fillText('Escanea para marcar asistencia', canvas.width / 2, 370)

        // Download
        const link = document.createElement('a')
        link.download = `QR-${sucursal.nombre.replace(/\s+/g, '-')}.png`
        link.href = canvas.toDataURL()
        link.click()

        toast.success('QR descargado exitosamente')
      }
      qrImg.src = qrDataUrl
    } catch {
      toast.error('Error al descargar QR')
    }
  }

  const generateNewQR = async (sucursalId: string) => {
    const newToken = crypto.randomUUID()

    const { error } = await supabase
      .from('sucursales')
      .update({ token_qr: newToken })
      .eq('id', sucursalId)

    if (error) {
      toast.error('Error al generar nuevo QR')
      return
    }

    // Update local state
    setSucursales(prev => prev.map(s =>
      s.id === sucursalId ? { ...s, token_qr: newToken } : s
    ))

    toast.success('Nuevo código QR generado')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generador de Códigos QR
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Crea y descarga códigos QR para cada sucursal
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sucursales.map((sucursal) => (
            <div
              key={sucursal.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {sucursal.nombre}
                </span>
              </div>

              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                  <QRCodeSVG
                    id={`qr-${sucursal.id}`}
                    value={sucursal.token_qr}
                    size={120}
                    level="M"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => downloadQR(sucursal)}
                  className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PNG
                </button>

                <button
                  onClick={() => generateNewQR(sucursal.id)}
                  className="w-full flex items-center justify-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Generar Nuevo
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}