import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { useInstrumentPrices, useInstrumentTransactions, usePositions } from '../api/queries'
import { money, number, percent, shortDate, sign, signedMoney } from '../lib/format'

export function PositionDetailPage() {
  const { instrumentId = '' } = useParams()
  const { selectedAccountId } = useAuth()
  const positions = usePositions(selectedAccountId)
  const txns = useInstrumentTransactions(selectedAccountId, instrumentId)
  const prices = useInstrumentPrices(instrumentId)

  const position = positions.data?.positions.find((p) => p.instrumentId === instrumentId)
  const currency = position?.currency ?? 'EUR'

  // Price points plus the gain % at each date. The gain % uses the average cost
  // *as of that date* (replayed from transactions), not the current avg cost —
  // otherwise the line would just be the price line rescaled.
  const series = useMemo(() => {
    const points = (prices.data ?? [])
      .map((p) => ({ date: p.date.slice(0, 10), close: Number.parseFloat(p.close) }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const trades = [...(txns.data ?? [])].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate))

    let ti = 0
    let qty = 0
    let basis = 0
    return points.map((pt) => {
      while (ti < trades.length && trades[ti].tradeDate.slice(0, 10) <= pt.date) {
        const t = trades[ti]
        const q = Number.parseFloat(t.quantity)
        if (t.type === 'BUY') {
          basis += q * Number.parseFloat(t.pricePerShare) + (Number.parseFloat(t.fee) || 0)
          qty += q
        } else {
          if (qty > 0) basis -= (basis / qty) * q // reduce basis at the running avg cost
          qty -= q
        }
        ti++
      }
      const avgCost = qty > 0 ? basis / qty : null
      const gainPct = avgCost && avgCost > 0 ? ((pt.close - avgCost) / avgCost) * 100 : null
      return { ...pt, gainPct }
    })
  }, [prices.data, txns.data])

  if (positions.isLoading) {
    return <div className="spinner">Loading…</div>
  }
  if (!position) {
    return (
      <div className="card card-pad empty">
        Position not found. <Link to="/">Back to dashboard</Link>
      </div>
    )
  }

  const stats: { label: string; value: string; cls?: string }[] = [
    { label: 'Quantity', value: number(position.quantity, 4) },
    { label: 'Avg cost', value: money(position.averageCost, currency) },
    { label: 'Cost basis', value: money(position.costBasis, currency) },
    { label: 'Market price', value: position.marketPrice ? money(position.marketPrice, currency) : '—' },
    { label: 'Market value', value: position.marketValue ? money(position.marketValue, currency) : '—' },
    {
      label: 'Unrealized',
      value:
        (position.unrealizedPnl ? signedMoney(position.unrealizedPnl, currency) : '—') +
        (position.unrealizedPnlPct != null ? ` (${percent(position.unrealizedPnlPct)})` : ''),
      cls: sign(position.unrealizedPnl),
    },
    { label: 'Realized', value: signedMoney(position.realizedPnl, currency), cls: sign(position.realizedPnl) },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/" className="faint" style={{ fontSize: '0.85rem' }}>← Dashboard</Link>
          <h1 style={{ marginTop: 4 }}>
            {position.symbol} <span className="faint" style={{ fontWeight: 400 }}>· {position.type}</span>
          </h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            {position.name}{position.isin ? ` · ${position.isin}` : ''}
            {position.priceAsOf ? ` · price as of ${shortDate(position.priceAsOf)}` : ''}
          </p>
        </div>
        <span className="ccy-chip">{currency}</span>
      </div>

      <div className="grid grid-cards" style={{ marginBottom: 22 }}>
        {stats.map((s) => (
          <div key={s.label} className="card card-pad">
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.cls ?? ''}`} style={{ fontSize: '1.25rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ marginBottom: 22 }}>
        <div className="flex between" style={{ marginBottom: 10 }}>
          <h2>Price history</h2>
          <span className="faint">{series.length} points</span>
        </div>
        {prices.isLoading ? (
          <div className="spinner">Loading…</div>
        ) : series.length === 0 ? (
          <div className="empty">No price history yet — fetch or backfill prices.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={series} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9aa1ad' }} minTickGap={48} />
              <YAxis
                yAxisId="price"
                tick={{ fontSize: 12, fill: '#9aa1ad' }}
                width={56}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(v)}
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                tick={{ fontSize: 12, fill: '#9aa1ad' }}
                width={56}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              />
              <Tooltip
                formatter={(v, name) => {
                  const n = typeof v === 'number' ? v : Number.parseFloat(String(v))
                  return [name === 'Gain %' ? percent(n) : money(n, currency), name]
                }}
              />
              <Legend />
              <Line
                yAxisId="price"
                name="Price"
                type="monotone"
                dataKey="close"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="pct"
                name="Gain %"
                type="monotone"
                dataKey="gainPct"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Transactions</h2>
          <span className="faint">{txns.data?.length ?? 0}</span>
        </div>
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th><th>Type</th>
                <th className="right">Qty</th><th className="right">Price</th><th className="right">Fee</th>
                <th>Broker</th><th>Source</th>
              </tr>
            </thead>
            <tbody>
              {(txns.data ?? []).map((t) => (
                <tr key={t.id}>
                  <td className="nowrap">{shortDate(t.tradeDate)}</td>
                  <td><span className={`badge ${t.type === 'BUY' ? 'buy' : 'sell'}`}>{t.type}</span></td>
                  <td className="right mono">{number(t.quantity, 4)}</td>
                  <td className="right mono">{money(t.pricePerShare, t.currency)}</td>
                  <td className="right mono">{money(t.fee, t.feeCurrency)}</td>
                  <td>{t.brokerType}</td>
                  <td><span className="badge muted">{t.source}</span></td>
                </tr>
              ))}
              {!txns.isLoading && (txns.data?.length ?? 0) === 0 && (
                <tr><td colSpan={7} className="empty">No transactions.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
