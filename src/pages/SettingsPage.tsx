import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  useBrokerConnections,
  useCreateAccount,
  useCreateBrokerConnection,
} from '../api/queries'
import { apiErrorMessage } from '../api/client'
import { shortDate } from '../lib/format'

export function SettingsPage() {
  const { selectedAccountId, setSelectedAccountId, refreshUser } = useAuth()
  const connections = useBrokerConnections(selectedAccountId)
  const createConnection = useCreateBrokerConnection(selectedAccountId)
  const createAccount = useCreateAccount()

  const [accountName, setAccountName] = useState('')
  const [label, setLabel] = useState('My IBKR')
  const [token, setToken] = useState('')
  const [queryId, setQueryId] = useState('')
  const [connError, setConnError] = useState<string | null>(null)

  async function addAccount(e: FormEvent) {
    e.preventDefault()
    const acc = await createAccount.mutateAsync(accountName)
    await refreshUser()
    setSelectedAccountId(acc.id)
    setAccountName('')
  }

  async function addConnection(e: FormEvent) {
    e.preventDefault()
    setConnError(null)
    try {
      await createConnection.mutateAsync({ label, brokerType: 'IBKR', credentials: { token, queryId } })
      setToken('')
      setQueryId('')
    } catch (err) {
      setConnError(apiErrorMessage(err, 'Only an owner can add a broker connection.'))
    }
  }

  return (
    <>
      <div className="page-head"><h1>Settings</h1></div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="card card-pad">
          <h2 style={{ marginBottom: 6 }}>New account</h2>
          <p className="muted" style={{ marginTop: 0 }}>Separate portfolios (e.g. personal, joint). You become its owner.</p>
          <form className="flex" style={{ gap: 8 }} onSubmit={addAccount}>
            <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Account name" required />
            <button className="btn-primary nowrap" disabled={createAccount.isPending}>Create</button>
          </form>
        </div>

        <div className="card card-pad">
          <h2 style={{ marginBottom: 6 }}>IBKR Flex connection</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Stored encrypted. A daily job pulls trades via the Flex Web Service. DeGiro has no API — use CSV import.
          </p>
          {connError && <div className="alert error">{connError}</div>}
          <form onSubmit={addConnection}>
            <div className="field"><label>Label</label><input value={label} onChange={(e) => setLabel(e.target.value)} required /></div>
            <div className="form-row">
              <div><label>Flex token</label><input value={token} onChange={(e) => setToken(e.target.value)} required /></div>
              <div><label>Query ID</label><input value={queryId} onChange={(e) => setQueryId(e.target.value)} required /></div>
            </div>
            <button className="btn-primary" disabled={createConnection.isPending}>{createConnection.isPending ? 'Saving…' : 'Connect'}</button>
          </form>

          <div className="stack" style={{ gap: 8, marginTop: 16 }}>
            {(connections.data ?? []).map((c) => (
              <div key={c.id} className="flex between">
                <div>
                  <div className="sym">{c.label}</div>
                  <div className="faint" style={{ fontSize: '0.78rem' }}>
                    {c.brokerType} · {c.lastSyncAt ? `last sync ${shortDate(c.lastSyncAt)}` : 'never synced'}
                  </div>
                </div>
                <span className={`badge ${c.active ? 'role' : 'muted'}`}>{c.active ? 'Active' : 'Off'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
