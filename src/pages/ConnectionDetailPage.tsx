import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useBrokerConnections, useBrokerSyncRuns } from '../api/queries'
import { dateTime } from '../lib/format'

export function ConnectionDetailPage() {
  const { connectionId = '' } = useParams()
  const { selectedAccountId } = useAuth()
  const connections = useBrokerConnections(selectedAccountId)
  const runs = useBrokerSyncRuns(connectionId)

  const connection = connections.data?.find((c) => c.id === connectionId)

  if (connections.isLoading) {
    return <div className="spinner">Loading…</div>
  }
  if (!connection) {
    return (
      <div className="card card-pad empty">
        Connection not found. <Link to="/settings">Back to settings</Link>
      </div>
    )
  }

  const stats: { label: string; value: string; cls?: string }[] = [
    { label: 'Broker', value: connection.brokerType },
    { label: 'Status', value: connection.active ? 'Active' : 'Off' },
    { label: 'Last sync', value: connection.lastSyncAt ? dateTime(connection.lastSyncAt) : 'Never' },
    { label: 'Sync runs', value: String(runs.data?.length ?? 0) },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/settings" className="faint" style={{ fontSize: '0.85rem' }}>← Settings</Link>
          <h1 style={{ marginTop: 4 }}>{connection.label}</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>Broker sync history</p>
        </div>
        <span className={`badge ${connection.active ? 'role' : 'muted'}`}>{connection.active ? 'Active' : 'Off'}</span>
      </div>

      <div className="grid grid-cards" style={{ marginBottom: 22 }}>
        {stats.map((s) => (
          <div key={s.label} className="card card-pad">
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.cls ?? ''}`} style={{ fontSize: '1.25rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Sync runs</h2>
          <span className="faint">{runs.data?.length ?? 0}</span>
        </div>
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>Fetched</th>
                <th className="right">Imported</th>
                <th className="right">Skipped</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {(runs.data ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="nowrap">{dateTime(r.createdAt)}</td>
                  <td>
                    <span className={`badge ${r.fetched ? 'buy' : 'sell'}`}>{r.fetched ? 'yes' : 'no'}</span>
                  </td>
                  <td className="right mono">{r.imported}</td>
                  <td className="right mono">{r.skipped}</td>
                  <td className="faint">{r.note ?? '—'}</td>
                </tr>
              ))}
              {runs.isLoading && (
                <tr><td colSpan={5} className="empty">Loading…</td></tr>
              )}
              {!runs.isLoading && (runs.data?.length ?? 0) === 0 && (
                <tr><td colSpan={5} className="empty">No sync runs yet — run the sync to see results here.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
