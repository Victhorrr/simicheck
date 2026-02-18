'use client'

import { ReactNode } from 'react'

interface BentoItem {
  id: string
  content: ReactNode
  size: 'small' | 'medium' | 'large'
  colSpan?: number
  rowSpan?: number
}

interface BentoGridProps {
  items: BentoItem[]
}

export default function BentoGrid({ items }: BentoGridProps) {
  const getGridClasses = (size: string, colSpan?: number, rowSpan?: number) => {
    const baseClasses = 'rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200 dark:border-gray-700'

    switch (size) {
      case 'large':
        return `${baseClasses} ${colSpan ? `col-span-${colSpan}` : 'col-span-full'} ${rowSpan ? `row-span-${rowSpan}` : 'row-span-2'}`
      case 'medium':
        return `${baseClasses} ${colSpan ? `col-span-${colSpan}` : 'col-span-1'} ${rowSpan ? `row-span-${rowSpan}` : 'row-span-1'}`
      case 'small':
      default:
        return `${baseClasses} ${colSpan ? `col-span-${colSpan}` : 'col-span-1'} ${rowSpan ? `row-span-${rowSpan}` : 'row-span-1'}`
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
      {items.map((item) => (
        <div
          key={item.id}
          className={getGridClasses(item.size, item.colSpan, item.rowSpan)}
        >
          {item.content}
        </div>
      ))}
    </div>
  )
}