'use client'

import { useEffect, useRef } from 'react'
import { Clock } from 'lucide-react'
import { TIMEZONE, LOCALE } from '@/lib/date-utils'

export function LiveClock() {
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const update = () => {
      if (spanRef.current) {
        spanRef.current.textContent = new Date().toLocaleTimeString(LOCALE, {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: TIMEZONE,
        })
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="hidden sm:inline-flex items-center gap-1.5 text-sm font-mono tabular-nums text-muted-foreground px-2">
      <Clock size={14} className="text-muted-foreground" />
      <span ref={spanRef} />
    </div>
  )
}
