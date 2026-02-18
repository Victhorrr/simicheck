'use client'

import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Sucursal {
  id: string
  nombre: string
  token_qr: string
  latitud: number
  longitud: number
}

export default function QRScanner() {
  const [scanResult, setScanResult] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])

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
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      )

      scanner.render(
        async (decodedText) => {
          setScanResult(decodedText)
          setIsScanning(false)
          scanner?.clear()

          // Validate QR
          const sucursal = sucursales.find(s => s.token_qr === decodedText)
          if (!sucursal) {
            toast.error('Código QR inválido')
            return
          }

          // Get GPS
          if (!navigator.geolocation) {
            toast.error('Geolocalización no soportada')
            return
          }

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords

              // Check geofence (simple distance, assume 100m radius)
              const distance = getDistance(latitude, longitude, sucursal.latitud, sucursal.longitud)
              if (distance > 0.1) { // 0.1 km = 100m
                toast.error('Fuera del rango de la sucursal')
                return
              }

              // Get user
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) {
                toast.error('Usuario no autenticado')
                return
              }

              // Get last asistencia
              const { data: lastAsistencia } = await supabase
                .from('asistencias')
                .select('tipo')
                .eq('empleado_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

              const tipo = lastAsistencia?.tipo === 'entrada' ? 'salida' : 'entrada'

              // Insert asistencia
              const { error } = await supabase
                .from('asistencias')
                .insert({
                  empleado_id: user.id,
                  sucursal_id: sucursal.id,
                  tipo,
                  latitud: latitude,
                  longitud: longitude,
                })

              if (error) {
                toast.error('Error al registrar asistencia')
              } else {
                toast.success(`${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada`)
              }
            },
            () => {
              toast.error('Error al obtener ubicación')
            }
          )
        },
        (error) => {
          console.log(error)
        }
      )
    }

    return () => {
      if (scanner) {
        scanner.clear()
      }
    }
  }, [isScanning, sucursales])

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
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={() => setIsScanning(!isScanning)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {isScanning ? 'Detener Escaneo' : 'Iniciar Escaneo'}
      </button>
      {isScanning && (
        <div id="qr-reader" className="w-full max-w-md"></div>
      )}
      {scanResult && (
        <p className="text-center">Escaneado: {scanResult}</p>
      )}
    </div>
  )
}