'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { format, parse, isValid, setHours, setMinutes } from 'date-fns'
import { de } from 'date-fns/locale'
import { CalendarIcon, X, Clock } from 'lucide-react'
import { DayPicker, UI, DayFlag, SelectionState } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function toDate(value: string): Date | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.includes('.')) {
    const parsed = parse(trimmed, trimmed.includes(':') ? 'dd.MM.yyyy HH:mm' : 'dd.MM.yyyy', new Date(), { locale: de })
    if (isValid(parsed)) return parsed
  }
  const clean = trimmed.replace(' ', 'T')
  const d = new Date(clean)
  return isValid(d) ? d : undefined
}

function toValue(date: Date | undefined): string {
  if (!date || !isValid(date)) return ''
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

function formatDisplay(date: Date | undefined): string {
  if (!date || !isValid(date)) return ''
  return format(date, 'dd.MM.yyyy HH:mm', { locale: de })
}

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minYear?: number
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'tt.mm.jjjj HH:MM',
  disabled = false,
  className,
  minYear = 2000,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(toDate(value))
  const [month, setMonth] = React.useState<Date>(toDate(value) || new Date())
  const [inputValue, setInputValue] = React.useState(formatDisplay(toDate(value)))
  const [timeHours, setTimeHours] = React.useState('')
  const [timeMinutes, setTimeMinutes] = React.useState('')
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null)

  const triggerRef = React.useRef<HTMLDivElement>(null)
  const popoverDivRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const d = toDate(value)
    setInternalDate(d)
    setInputValue(formatDisplay(d))
    if (d && isValid(d)) {
      setTimeHours(String(d.getHours()).padStart(2, '0'))
      setTimeMinutes(String(d.getMinutes()).padStart(2, '0'))
      setMonth(d)
    } else {
      setTimeHours('')
      setTimeMinutes('')
    }
  }, [value])

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popoverHeight = 390
    const popoverWidth = 280
    const vh = window.innerHeight
    const vw = window.innerWidth

    let top = rect.bottom + 4
    if (rect.bottom + popoverHeight > vh - 12 && rect.top - popoverHeight > 12) {
      top = rect.top - popoverHeight - 4
    }

    let left = rect.left
    if (left + popoverWidth > vw - 16) {
      left = Math.max(16, vw - popoverWidth - 16)
    }
    if (left < 16) {
      left = 16
    }

    setCoords({ top, left })
  }, [])

  React.useEffect(() => {
    if (!open) return
    updatePosition()

    const handleMousedownOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current && triggerRef.current.contains(target)) return
      if (popoverDivRef.current && popoverDivRef.current.contains(target)) return
      setOpen(false)
    }

    const handleScrollOrResize = () => {
      updatePosition()
    }

    document.addEventListener('mousedown', handleMousedownOutside)
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true })

    return () => {
      document.removeEventListener('mousedown', handleMousedownOutside)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true })
    }
  }, [open, updatePosition])

  const emit = (date: Date | undefined) => {
    setInternalDate(date)
    onChange(toValue(date))
    setInputValue(formatDisplay(date))
    if (date && isValid(date)) {
      setMonth(date)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setInputValue(raw)

    if (raw.length >= 10) {
      const parsed = toDate(raw)
      if (parsed && isValid(parsed)) {
        emit(parsed)
      }
    }
  }

  const handleInputBlur = () => {
    if (inputValue.length === 0) {
      emit(undefined)
      return
    }
    const parsed = toDate(inputValue)
    if (parsed && isValid(parsed)) {
      emit(parsed)
    } else {
      setInputValue(formatDisplay(internalDate))
    }
  }

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return
    let combined = day
    const h = parseInt(timeHours || '0', 10)
    const m = parseInt(timeMinutes || '0', 10)
    if (!isNaN(h) && !isNaN(m)) {
      combined = setMinutes(setHours(day, h), m)
    }
    emit(combined)
    setOpen(false)
  }

  const handleClear = () => {
    emit(undefined)
    setInputValue('')
    setTimeHours('')
    setTimeMinutes('')
    setOpen(false)
  }

  const handleTimeChange = (h: string, m: string) => {
    setTimeHours(h)
    setTimeMinutes(m)
    const hi = parseInt(h, 10)
    const mi = parseInt(m, 10)
    if (isNaN(hi) || isNaN(mi)) return
    const base = internalDate && isValid(internalDate) ? internalDate : new Date()
    const updated = setMinutes(setHours(base, hi), mi)
    setInternalDate(updated)
  }

  const handleTimeOk = () => {
    const hi = parseInt(timeHours || '0', 10)
    const mi = parseInt(timeMinutes || '0', 10)
    if (isNaN(hi) || isNaN(mi)) {
      setOpen(false)
      return
    }
    const base = internalDate && isValid(internalDate) ? internalDate : new Date()
    const updated = setMinutes(setHours(base, hi), mi)
    emit(updated)
    setOpen(false)
  }

  const toggleOpen = () => {
    if (!open) {
      const d = internalDate && isValid(internalDate) ? internalDate : undefined
      if (d) {
        setTimeHours(String(d.getHours()).padStart(2, '0'))
        setTimeMinutes(String(d.getMinutes()).padStart(2, '0'))
        setMonth(d)
      } else {
        setMonth(new Date())
      }
      updatePosition()
    }
    setOpen(!open)
  }

  return (
    <div ref={triggerRef} className={cn('relative', className)}>
      <div className="flex items-center gap-0">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full min-w-0 flex-1 rounded-l-lg border border-border bg-card px-3 py-1 text-sm text-foreground shadow-sm transition-colors',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'font-mono text-xs tracking-wider'
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          onClick={toggleOpen}
          className={cn('h-9 w-9 rounded-l-none rounded-r-lg border-l-0 shrink-0 cursor-pointer', open && 'bg-muted')}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {open && mounted && coords && createPortal(
        <div
          ref={popoverDivRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 10000,
          }}
          className={cn(
            'fixed z-[10000] rounded-xl border border-border bg-popover p-3 shadow-2xl',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <DayPicker
            mode="single"
            selected={internalDate}
            month={month}
            onMonthChange={setMonth}
            onSelect={handleDaySelect}
            locale={de}
            weekStartsOn={1}
            showOutsideDays
            captionLayout="dropdown"
            startMonth={new Date(new Date().getFullYear() - 2, 0)}
            endMonth={new Date(new Date().getFullYear() + 3, 11)}
            className="!m-0"
            classNames={{
              [UI.Month]: 'space-y-3',
              [UI.MonthCaption]: 'flex items-center justify-between px-1 py-1',
              [UI.CaptionLabel]: 'hidden',
              [UI.Dropdowns]: 'flex items-center gap-1.5 font-medium text-xs text-foreground',
              [UI.Dropdown]: 'rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500 hover:bg-muted/50 transition-colors',
              [UI.Nav]: 'flex items-center gap-1',
              [UI.PreviousMonthButton]:
                'inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors size-7 cursor-pointer',
              [UI.NextMonthButton]:
                'inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors size-7 cursor-pointer',
              [UI.MonthGrid]: 'w-full border-collapse border-spacing-0 mt-1',
              [UI.Weekdays]: '',
              [UI.Weekday]:
                'w-9 text-xs font-medium text-muted-foreground text-center pb-2',
              [UI.Weeks]: '',
              [UI.Week]: '',
              [UI.Day]: cn(
                'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
                '[&:has([aria-selected])]:bg-accent/50'
              ),
              [UI.DayButton]: cn(
                'inline-flex items-center justify-center rounded-lg size-9 text-xs font-medium text-foreground transition-all cursor-pointer',
                'hover:bg-indigo-600/20 hover:text-indigo-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
              ),
              [SelectionState.selected]:
                '!bg-indigo-600 !text-white font-bold shadow-md shadow-indigo-600/30',
              [DayFlag.today]: 'font-bold text-indigo-400 border border-indigo-500/50',
              [DayFlag.outside]: '!text-muted-foreground/30 font-normal',
              [DayFlag.disabled]: '!text-muted-foreground/20 cursor-not-allowed',
              [DayFlag.hidden]: 'invisible',
            }}
          />
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="number"
              min={0}
              max={23}
              value={timeHours}
              onChange={(e) => handleTimeChange(e.target.value, timeMinutes || '00')}
              placeholder="HH"
              className="h-8 w-14 text-center text-xs font-mono bg-card border-border [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-muted-foreground text-sm">:</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={timeMinutes}
              onChange={(e) => handleTimeChange(timeHours || '00', e.target.value)}
              placeholder="MM"
              className="h-8 w-14 text-center text-xs font-mono bg-card border-border [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTimeOk}
              className="h-8 ml-auto text-xs font-semibold cursor-pointer"
            >
              OK
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

