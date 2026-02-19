'use client'

import { useEffect, useState, useRef } from 'react'
import { MapPin } from 'lucide-react'

interface AddressSearchProps {
  value: string
  onChange: (address: string, lat: number, lng: number) => void
  placeholder?: string
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: {
    city?: string
    state?: string
    country?: string
  }
}

export default function AddressSearch({
  value,
  onChange,
  placeholder = 'Busca una dirección...'
}: AddressSearchProps) {
  const [inputValue, setInputValue] = useState(value)
  const [predictions, setPredictions] = useState<NominatimResult[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleInputChange = (text: string) => {
    setInputValue(text)

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (text.length < 2) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    setIsLoading(true)

    // Debounce the search
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=8&countrycodes=co`,
          {
            headers: {
              'User-Agent': 'CheckSimi-App'
            }
          }
        )

        if (!response.ok) throw new Error('Search failed')

        const results: NominatimResult[] = await response.json()
        setPredictions(results)
        setShowPredictions(results.length > 0)
      } catch (error) {
        console.error('Error fetching predictions:', error)
        setPredictions([])
      } finally {
        setIsLoading(false)
      }
    }, 500)
  }

  const handleSelectPrediction = (result: NominatimResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    
    setInputValue(result.display_name)
    setPredictions([])
    setShowPredictions(false)
    
    onChange(result.display_name, lat, lng)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute left-3 top-3 text-gray-400">
          <MapPin className="h-5 w-5" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => inputValue.length >= 2 && predictions.length > 0 && setShowPredictions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {predictions.map((result) => {
            // Extract city/locality info
            const parts = result.display_name.split(',')
            const mainText = parts[0]?.trim() || result.display_name
            const secondaryText = parts.slice(1).join(',').trim()

            return (
              <button
                key={result.place_id}
                onClick={() => handleSelectPrediction(result)}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {mainText}
                    </p>
                    {secondaryText && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {secondaryText}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
