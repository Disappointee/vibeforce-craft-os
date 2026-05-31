'use client'

import * as React from 'react'
import { format, parse, isValid, setHours, setMinutes } from 'date-fns'
import { de } from 'date-fns/locale'
import { CalendarIcon, X, Clock } from 'lucide-react'
import { DayPicker, UI, DayFlag, SelectionState } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function toDate(value: string): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
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
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'tt.mm.jjjj HH:MM',
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(toDate(value))
  const [inputValue, setInputValue] = React.useState(formatDisplay(toDate(value)))
  const [timeHours, setTimeHours] = React.useState('')
  const [timeMinutes, setTimeMinutes] = React.useState('')
  const popoverRef = React.useRef<HTMLDivElement>(null)
  const popoverDivRef = React.useRef<HTMLDivElement>(null)
  const [popoverStyle, setPopoverStyle] = React.useState<React.CSSProperties>({})

  React.useEffect(() => {
    const d = toDate(value)
    setInternalDate(d)
    setInputValue(formatDisplay(d))
    if (d) {
      setTimeHours(String(d.getHours()).padStart(2, '0'))
      setTimeMinutes(String(d.getMinutes()).padStart(2, '0'))
    } else {
      setTimeHours('')
      setTimeMinutes('')
    }
  }, [value])

  React.useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  React.useEffect(() => {
    if (!open) {
      setPopoverStyle({})
      return
    }
    const raf = requestAnimationFrame(() => {
      const el = popoverDivRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const style: React.CSSProperties = {}

      if (rect.bottom > vh - 16) {
        style.bottom = '100%'
        style.top = 'auto'
        style.marginTop = '0'
        style.marginBottom = '0.25rem'
      }
      if (rect.top < 16) {
        style.top = '100%'
        style.bottom = 'auto'
        style.marginTop = '0.25rem'
        style.marginBottom = '0'
      }
      if (rect.right > vw - 16) {
        style.left = 'auto'
        style.right = '0'
      }
      if (rect.left < 16) {
        style.left = '0'
        style.right = 'auto'
      }

      if (Object.keys(style).length > 0) {
        setPopoverStyle(style)
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [open])

  const emit = (date: Date | undefined) => {
    setInternalDate(date)
    onChange(toValue(date))
    setInputValue(formatDisplay(date))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setInputValue(raw)

    if (raw.length >= 16) {
      const parsed = parse(raw, 'dd.MM.yyyy HH:mm', new Date(), { locale: de })
      if (isValid(parsed)) {
        emit(parsed)
      }
    }
  }

  const handleInputBlur = () => {
    if (inputValue.length === 0) {
      emit(undefined)
      return
    }
    const parsed = parse(inputValue, 'dd.MM.yyyy HH:mm', new Date(), { locale: de })
    if (isValid(parsed)) {
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

  return (
    <div ref={popoverRef} className={cn('relative', className)}>
      <div className="flex items-center gap-0">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full rounded-l-lg border border-border bg-card px-3 py-1 text-sm text-foreground shadow-sm transition-colors',
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
          onClick={() => {
            if (!open) {
              const d = internalDate && isValid(internalDate) ? internalDate : undefined
              if (d) {
                setTimeHours(String(d.getHours()).padStart(2, '0'))
                setTimeMinutes(String(d.getMinutes()).padStart(2, '0'))
              }
            }
            setOpen(!open)
          }}
          className={cn('h-9 w-9 rounded-l-none rounded-r-lg border-l-0 shrink-0', open && 'bg-muted')}
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {open && (
        <div
          ref={popoverDivRef}
          className={cn(
            'absolute top-full left-0 z-[9999] mt-1 rounded-xl border border-border bg-popover p-3 shadow-lg',
            'animate-in fade-in-0 zoom-in-95'
          )}
          style={popoverStyle}
        >
          <DayPicker
            mode="single"
            selected={internalDate}
            onSelect={handleDaySelect}
            locale={de}
            weekStartsOn={1}
            showOutsideDays
            className="!m-0"
            classNames={{
              [UI.Month]: 'space-y-3',
              [UI.MonthCaption]: 'flex items-center justify-between px-1 py-1',
              [UI.CaptionLabel]: 'text-sm font-medium text-foreground',
              [UI.Nav]: 'flex items-center gap-1',
              [UI.PreviousMonthButton]:
                'inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors size-7',
              [UI.NextMonthButton]:
                'inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors size-7',
              [UI.MonthGrid]: 'w-full border-collapse',
              [UI.Weekdays]: '',
              [UI.Weekday]:
                'w-9 text-xs font-medium text-muted-foreground text-center pb-2',
              [UI.Weeks]: 'w-full mt-1',
              [UI.Day]: cn(
                'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
                '[&:has([aria-selected])]:bg-accent/50'
              ),
              [UI.DayButton]: cn(
                'inline-flex items-center justify-center rounded-lg size-9 text-sm font-normal text-foreground',
                'hover:bg-muted hover:text-foreground transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
              ),
              [SelectionState.selected]:
                'bg-indigo-600 text-white hover:bg-indigo-500 font-medium',
              [DayFlag.today]: 'font-bold text-indigo-400',
              [DayFlag.outside]: 'text-muted-foreground/50',
              [DayFlag.disabled]: 'text-muted-foreground/30',
              [DayFlag.hidden]: 'invisible',
            }}
          />
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
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
              className="h-8 ml-auto text-xs"
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
