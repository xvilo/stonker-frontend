import { useAuth } from '../auth/AuthContext'
import { usePnl, usePositions } from '../api/queries'
import { money, number, percent, shortDate, sign, signedMoney } from '../lib/format'

export function DashboardPage() {
  const { selectedAccountId } = useAuth()
  const pnl = usePnl(selectedAccountId)
  const positions = usePositions(selectedAccountId)

  const buckets = pnl.data?.buckets ?? []
  const rows = positions.data?.positions ?? []

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            {pnl.data ? `As of ${shortDate(pnl.data.asOf)}` : 'Your holdings and profit/loss'}
          </p>
        </div>
      </div>

      {pnl.isLoading ? (
        <div className="spinner">Loading…</div>
      ) : buckets.length === 0 ? (
        <div className="card card-pad empty">
          No holdings yet. Add a transaction or import a broker CSV to get started.
        </div>
      ) : (
        <div className="grid grid-cards" style={{ marginBottom: 22 }}>
          {buckets.map((b) => (
            <div key={b.currency} className="card card-pad">
              <div className="flex between">
                <span className="stat-label">Market value</span>
                <span className="ccy-chip">{b.currency}</span>
              </div>
              <div className="stat-value">{money(b.marketValue, b.currency)}</div>
              <div className={`stat-sub ${sign(b.totalPnl)}`}>
                {signedMoney(b.totalPnl, b.currency)} total P/L
              </div>
              <div className="stat-sub muted">
                Unrealized <span className={sign(b.unrealizedPnl)}>{signedMoney(b.unrealizedPnl, b.currency)}</span>
                {b.unrealizedPnlPct != null && <> ({percent(b.unrealizedPnlPct)})</>}
              </div>
              <div className="stat-sub muted">
                Realized <span className={sign(b.realizedPnl)}>{signedMoney(b.realizedPnl, b.currency)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h2>Positions</h2>
          <span className="faint">{rows.length} instruments</span>
        </div>
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Instrument</th>
                <th className="right">Qty</th>
                <th className="right">Avg cost</th>
                <th className="right">Price</th>
                <th className="right">Market value</th>
                <th className="right">Unrealized</th>
                <th className="right">Realized</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.instrumentId}>
                  <td>
                    <span className="sym">
                      {p.symbol}
                      <small>{p.name} · {p.type}</small>
                    </span>
                  </td>
                  <td className="right mono">{number(p.quantity, 4)}</td>
                  <td className="right mono">{money(p.averageCost, p.currency)}</td>
                  <td className="right mono">{p.marketPrice ? money(p.marketPrice, p.currency) : '—'}</td>
                  <td className="right mono">{p.marketValue ? money(p.marketValue, p.currency) : '—'}</td>
                  <td className={`right mono ${sign(p.unrealizedPnl)}`}>
                    {p.unrealizedPnl ? signedMoney(p.unrealizedPnl, p.currency) : '—'}
                    {p.unrealizedPnlPct != null && (
                      <div className="faint" style={{ fontSize: '0.78rem' }}>{percent(p.unrealizedPnlPct)}</div>
                    )}
                  </td>
                  <td className={`right mono ${sign(p.realizedPnl)}`}>{signedMoney(p.realizedPnl, p.currency)}</td>
                </tr>
              ))}
              {rows.length === 0 && !positions.isLoading && (
                <tr><td colSpan={7} className="empty">No positions.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
