import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useAccounts, useCreateInvitation, useInvitations } from '../api/queries'
import { apiErrorMessage } from '../api/client'
import type { MembershipRole } from '../api/types'
import { shortDate } from '../lib/format'

export function MembersPage() {
  const { selectedAccountId } = useAuth()
  const { data: accounts } = useAccounts()
  const invitations = useInvitations(selectedAccountId)
  const invite = useCreateInvitation(selectedAccountId)

  const account = accounts?.find((a) => a.id === selectedAccountId)
  const members = account?.memberships ?? []

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MembershipRole>('VIEWER')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await invite.mutateAsync({ email, role })
      setEmail('')
    } catch (err) {
      setError(apiErrorMessage(err, 'Only an owner can invite members.'))
    }
  }

  const inviteLink = (token: string) => `${window.location.origin}/invite/${token}`

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Members</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>People with access to {account?.name}</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' }}>
        <div className="card">
          <div className="card-head"><h2>Team</h2><span className="faint">{members.length}</span></div>
          <div className="table-scroll">
            <table className="data">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="sym">{m.user?.name ?? '—'}</td>
                    <td className="muted">{m.user?.email ?? '—'}</td>
                    <td><span className="badge role">{m.role}</span></td>
                    <td className="muted nowrap">{shortDate(m.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="card card-pad">
            <h2 style={{ marginBottom: 14 }}>Invite someone</h2>
            {error && <div className="alert error">{error}</div>}
            <form onSubmit={submit}>
              <div className="field"><label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="colleague@example.com" />
              </div>
              <div className="field"><label>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as MembershipRole)}>
                  <option value="VIEWER">Viewer — read only</option>
                  <option value="EDITOR">Editor — record transactions</option>
                  <option value="OWNER">Owner — full control</option>
                </select>
              </div>
              <button className="btn-primary" disabled={invite.isPending}>{invite.isPending ? 'Inviting…' : 'Send invite'}</button>
            </form>
          </div>

          <div className="card">
            <div className="card-head"><h2>Pending invites</h2></div>
            <div className="card-pad stack" style={{ gap: 10 }}>
              {(invitations.data ?? []).filter((i) => i.status === 'PENDING').map((i) => (
                <div key={i.id} className="flex between" style={{ gap: 8 }}>
                  <div>
                    <div className="sym">{i.email}</div>
                    <div className="faint" style={{ fontSize: '0.78rem' }}>{i.role} · expires {shortDate(i.expiresAt)}</div>
                  </div>
                  <button className="btn-sm" onClick={() => navigator.clipboard?.writeText(inviteLink(i.token))}>Copy link</button>
                </div>
              ))}
              {(invitations.data ?? []).filter((i) => i.status === 'PENDING').length === 0 && (
                <div className="faint">No pending invitations.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
