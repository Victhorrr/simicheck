'use client'

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  gradient: string
}

export default function StatCard({ title, value, change, changeType, icon: Icon, gradient }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${
              changeType === 'positive' ? 'text-green-200' :
              changeType === 'negative' ? 'text-red-200' :
              'text-gray-200'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="opacity-20">
          <Icon className="h-12 w-12" />
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 opacity-10">
        <Icon className="h-24 w-24" />
      </div>
    </div>
  )
}