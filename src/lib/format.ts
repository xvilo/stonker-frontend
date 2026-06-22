// Formatting helpers. API money values are decimal strings; parse only for
// display (never for arithmetic that matters).

/** Shown in place of a currency value when privacy mode hides amounts. */
export const REDACTED = '•••'

export function money(value: string | number | null | undefined, currency: string): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(n)) return '—'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `${n.toFixed(2)} ${currency}`
  }
}

export function number(value: string | number | null | undefined, maxFractionDigits = 4): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: maxFractionDigits }).format(n)
}

export function percent(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

export function signedMoney(value: string | number | null | undefined, currency: string): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return sign + money(Math.abs(n) * (n < 0 ? -1 : 1), currency)
}

/** Sign of a numeric string, for colouring gains/losses. */
export function sign(value: string | number | null | undefined): 'pos' | 'neg' | 'zero' {
  if (value === null || value === undefined || value === '') return 'zero'
  const n = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(n) || n === 0) return 'zero'
  return n > 0 ? 'pos' : 'neg'
}

export function shortDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Date + time of day, for events that can recur within a day (e.g. sync runs). */
export function dateTime(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
