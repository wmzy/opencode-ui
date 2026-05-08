const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"]

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  )
  const value = bytes / Math.pow(1024, exponent)
  const formatted = exponent === 0 ? value.toString() : value.toFixed(1)
  return `${formatted} ${BYTE_UNITS[exponent]}`
}

export function formatCost(cost: number): string {
  if (cost === 0) return "$0"
  if (cost < 0.01) return `<$0.01`
  if (cost < 1) return `$${cost.toFixed(2)}`
  return `$${cost.toFixed(2)}`
}

export function truncateMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  const half = Math.floor((maxLength - 3) / 2)
  return str.slice(0, half) + "..." + str.slice(str.length - half)
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}
