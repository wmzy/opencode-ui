const UNITS: Array<{ ms: number; label: string }> = [
  { ms: 365 * 24 * 60 * 60 * 1000, label: "y" },
  { ms: 30 * 24 * 60 * 60 * 1000, label: "mo" },
  { ms: 7 * 24 * 60 * 60 * 1000, label: "w" },
  { ms: 24 * 60 * 60 * 1000, label: "d" },
  { ms: 60 * 60 * 1000, label: "h" },
  { ms: 60 * 1000, label: "m" },
  { ms: 1000, label: "s" },
]

export function formatRelativeTime(timestamp: number | Date): string {
  const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp
  const diff = Date.now() - date.getTime()
  const absDiff = Math.abs(diff)

  if (absDiff < 60000) return "just now"

  for (const unit of UNITS) {
    const count = Math.floor(absDiff / unit.ms)
    if (count > 0) {
      return `${count}${unit.label} ${diff > 0 ? "ago" : "from now"}`
    }
  }

  return "just now"
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    const m = minutes % 60
    const s = seconds % 60
    return m > 0 ? `${hours}h ${m}m ${s}s` : `${hours}h ${s}s`
  }

  if (minutes > 0) {
    const s = seconds % 60
    return s > 0 ? `${minutes}m ${s}s` : `${minutes}m`
  }

  return `${seconds}s`
}

export function parseISODate(value: string): Date {
  return new Date(value)
}

export function toISODateString(date: Date): string {
  return date.toISOString()
}

export function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export function isToday(date: Date): boolean {
  return startOfDay(date).getTime() === startOfDay(new Date()).getTime()
}

export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return startOfDay(date).getTime() === startOfDay(yesterday).getTime()
}
