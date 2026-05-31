export const TIMEZONE = 'Europe/Berlin'
export const LOCALE = 'de-DE'

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  })
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  })
}

export function nowDate(): string {
  return new Date().toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIMEZONE,
  })
}

export function nowTime(): string {
  return new Date().toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  })
}

export function now(): Date {
  const d = new Date()
  const berlinTime = d.toLocaleString('de-DE', { timeZone: TIMEZONE, hour12: false })
  const [datePart, timePart] = berlinTime.split(', ')
  const [day, month, year] = datePart.split('.').map(Number)
  const [hours, minutes, seconds] = timePart.split(':').map(Number)
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds))
}
