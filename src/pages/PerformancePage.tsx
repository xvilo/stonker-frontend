import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../auth/AuthContext'
import { usePerformance } from '../api/queries'
import { useAmountsHidden } from '../lib/privacy'
import { REDACTED } from '../lib/format'

type Metric = 'marketValue' | 'pnl' | 'pnlPct'
const METRICS: { key: Metric; label: string }[] = [
  { key: 'marketValue', label: 'Value' },
  { key: 'pnl', label: 'P/L' },
  { key: 'pnlPct', label: '% Return' },
]
const RANGES: { key: string; label: string; days: number }[] = [
  { key: '3M', label: '3M', days: 90 },
  { key: '6M', label: '6M', days: 180 },
  { key: '1Y', label: '1Y', days: 365 },
  { key: 'ALL', label: 'All', days: 0 },
]
const COLORS = ['#4f46e5', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899']

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function PerformancePage() {
  const { selectedAccountId } = useAuth()
  const hideAmounts = useAmountsHidden()
  const [metric, setMetric] = useState<Metric>('marketValue')
  const [range, setRange] = useState('1Y')

  const from = useMemo(() => {
    const r = RANGES.find((x) => x.key === range)!
    return r.days ? isoDaysAgo(r.days) : undefined
  }, [range])

  const { data, isLoading } = usePerformance(selectedAccountId, from ? { from } : {})
  const series = data?.series ?? []

  // Merge per-currency series into one row per date keyed by currency.
  const { rows, currencies } = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>()
    const ccys: string[] = []
    for (const s of series) {
      ccys.push(s.currency)
      for (const p of s.points) {
        const row = byDate.get(p.date) ?? { date: p.date }
        const v = p[metric]
        if (v != null) row[s.currency] = Number.parseFloat(v)
        byDate.set(p.date, row)
      }
    }
    return {
      rows: [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))),
      currencies: ccys,
    }
  }, [series, metric])

  // The value/P-L axes carry currency amounts → redact under privacy mode.
  // The % return axis is not a currency, so it stays readable.
  const fmtY = (v: number) => {
    if (metric === 'pnlPct') return `${v.toFixed(0)}%`
    if (hideAmounts) return REDACTED
    return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(v)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Performance</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>One line per currency — no cross-currency blending.</p>
        </div>
        <div className="flex" style={{ gap: 12 }}>
          <div className="segment">
            {METRICS.map((m) => (
              <button key={m.key} className={metric === m.key ? 'active' : ''} onClick={() => setMetric(m.key)}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="segment">
            {RANGES.map((r) => (
              <button key={r.key} className={range === r.key ? 'active' : ''} onClick={() => setRange(r.key)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card card-pad">
        {isLoading ? (
          <div className="spinner">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty">No performance data yet. Add transactions and price snapshots.</div>
        ) : (
          <ResponsiveContainer width="100%" height={420}>
            <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9aa1ad' }} minTickGap={48} />
              <YAxis tickFormatter={fmtY} tick={{ fontSize: 12, fill: '#9aa1ad' }} width={56} />
              <Tooltip
                formatter={(value, name) => {
                  if (metric !== 'pnlPct' && hideAmounts) return [REDACTED, String(name)]
                  const n = typeof value === 'number' ? value : Number.parseFloat(String(value))
                  return [metric === 'pnlPct' ? `${n.toFixed(2)}%` : n.toFixed(2), String(name)]
                }}
              />
              <Legend />
              {currencies.map((ccy, i) => (
                <Line
                  key={ccy}
                  type="monotone"
                  dataKey={ccy}
                  name={ccy}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  )
}
