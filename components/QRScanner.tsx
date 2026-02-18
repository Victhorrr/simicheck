'use client'

import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

interface Sucursal {
  id: string
  nombre: string
  token_qr: string
  latitud: number
  longitud: number
}

interface LastAsistencia {
  tipo: 'entrada' | 'salida'
  created_at: string
  sucursal_id: string
}

export default function QRScanner() {
  const [scanResult, setScanResult] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastAction, setLastAction] = useState<{ tipo: string; timestamp: Date } | null>(null)

  useEffect(() => {
    // Fetch sucursales
    const fetchSucursales = async () => {
      const { data, error } = await supabase.from('sucursales').select('*')
      if (error) {
        toast.error('Error al cargar sucursales')
        return
      }
      setSucursales(data || [])
    }
    fetchSucursales()
  }, [])

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null

    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 30, // Higher FPS for faster scanning
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
        },
        false
      )

      scanner.render(
        async (decodedText) => {
          if (isProcessing) return // Prevent multiple simultaneous scans

          setScanResult(decodedText)
          setIsScanning(false)
          scanner?.clear()
          setIsProcessing(true)

          try {
            await processScan(decodedText)
          } finally {
            setIsProcessing(false)
          }
        },
        (error) => {
          // Silent error handling for scan errors
        }
      )
    }

    return () => {
      if (scanner) {
        scanner.clear()
      }
    }
  }, [isScanning, sucursales, isProcessing])

  const processScan = async (qrCode: string) => {
    // Validate QR code
    const sucursal = sucursales.find(s => s.token_qr === qrCode)
    if (!sucursal) {
      toast.error('Código QR inválido', {
        description: 'Este código no corresponde a ninguna sucursal registrada.'
      })
      return
    }

    // Check geolocation support
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada', {
        description: 'Su dispositivo no soporta geolocalización.'
      })
      return
    }

    // Get current position with timeout
    const position = await getCurrentPosition()
    if (!position) return

    const { latitude, longitude } = position.coords

    // Validate geofence (100m radius)
    const distance = getDistance(latitude, longitude, sucursal.latitud, sucursal.longitud)
    if (distance > 0.1) { // 0.1 km = 100m
      toast.error('Fuera del rango de la sucursal', {
        description: `Distancia: ${(distance * 1000).toFixed(0)}m. Debe estar dentro de 100m de ${sucursal.nombre}.`
      })
      return
    }

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Usuario no autenticado')
      return
    }

    // Anti-fraud validation: Check last asistencia
    const { data: lastAsistencias, error: lastError } = await supabase
      .from('asistencias')
      .select('tipo, created_at, sucursal_id')
      .eq('empleado_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (lastError) {
      toast.error('Error al verificar estado')
      return
    }

    const lastAsistencia = lastAsistencias?.[0] as LastAsistencia | undefined
    const now = new Date()

    // Determine next action type
    let tipo: 'entrada' | 'salida'

    if (!lastAsistencia) {
      // First check-in ever
      tipo = 'entrada'
    } else if (lastAsistencia.tipo === 'entrada') {
      // Last was check-in, so this should be check-out
      tipo = 'salida'
    } else {
      // Last was check-out, so this should be check-in
      tipo = 'entrada'
    }

    // Additional anti-fraud: Prevent rapid successive scans (within 30 seconds)
    if (lastAsistencia && tipo === lastAsistencia.tipo) {
      const timeDiff = now.getTime() - new Date(lastAsistencia.created_at).getTime()
      if (timeDiff < 30000) { // 30 seconds
        toast.error('Acción demasiado rápida', {
          description: 'Debe esperar al menos 30 segundos entre acciones.'
        })
        return
      }
    }

    // If checking out, ensure it's from the same branch
    if (tipo === 'salida' && lastAsistencia && lastAsistencia.sucursal_id !== sucursal.id) {
      toast.error('Sucursal incorrecta', {
        description: 'Debe marcar salida desde la misma sucursal donde marcó entrada.'
      })
      return
    }

    // Insert asistencia record
    const { error: insertError } = await supabase
      .from('asistencias')
      .insert({
        empleado_id: user.id,
        sucursal_id: sucursal.id,
        tipo,
        latitud: latitude,
        longitud: longitude,
      })

    if (insertError) {
      toast.error('Error al registrar asistencia', {
        description: insertError.message
      })
      return
    }

    // Success
    setLastAction({ tipo, timestamp: now })
    toast.success(`${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada`, {
      description: `${sucursal.nombre} - ${now.toLocaleTimeString()}`
    })
  }

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          let message = 'Error al obtener ubicación'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permiso de ubicación denegado'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Ubicación no disponible'
              break
            case error.TIMEOUT:
              message = 'Tiempo de espera agotado'
              break
          }
          toast.error(message)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in km
    return d
  }

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180)
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Status Card */}
      {lastAction && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              lastAction.tipo === 'entrada'
                ? 'bg-green-100 dark:bg-green-900'
                : 'bg-amber-100 dark:bg-amber-900'
            }`}>
              {lastAction.tipo === 'entrada' ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {lastAction.tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {lastAction.timestamp.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Button */}
      <button
        onClick={() => setIsScanning(!isScanning)}
        disabled={isProcessing}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-medium shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Procesando...</span>
          </div>
        ) : isScanning ? (
          'Detener Escaneo'
        ) : (
          'Iniciar Escaneo'
        )}
      </button>

      {/* Scanner Container */}
      {isScanning && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Apunte al código QR de la sucursal
            </span>
          </div>
          <div id="qr-reader" className="w-full"></div>
        </div>
      )}

      {/* Scan Result */}
      {scanResult && !isScanning && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Código escaneado: {scanResult.substring(0, 20)}...
            </span>
          </div>
        </div>
      )}
    </div>
  )
}