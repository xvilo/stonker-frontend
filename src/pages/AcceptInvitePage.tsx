import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAcceptInvitation } from '../api/queries'
import { useAuth } from '../auth/AuthContext'
import { apiErrorMessage } from '../api/client'

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const accept = useAcceptInvitation()
  const { refreshUser, setSelectedAccountId } = useAuth()
  const [state, setState] = useState<'working' | 'done' | 'error'>('working')
  const [message, setMessage] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current || !token) return
    ran.current = true
    void (async () => {
      try {
        const inv = await accept.mutateAsync(token)
        await refreshUser()
        if (inv?.account?.id) setSelectedAccountId(inv.account.id)
        setState('done')
        setMessage(`You've joined ${inv?.account?.name ?? 'the account'}.`)
      } catch (err) {
        setState('error')
        setMessage(apiErrorMessage(err, 'This invitation could not be accepted.'))
      }
    })()
  }, [token, accept, refreshUser, setSelectedAccountId])

  return (
    <div className="auth-wrap">
      <div className="card card-pad auth-card" style={{ textAlign: 'center' }}>
        <div className="brand" style={{ justifyContent: 'center' }}><span className="dot" /> Stonker</div>
        {state === 'working' && <p className="muted">Accepting invitation…</p>}
        {state === 'done' && <div className="alert success">{message}</div>}
        {state === 'error' && <div className="alert error">{message}</div>}
        {state !== 'working' && (
          <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/')}>
            Go to dashboard
          </button>
        )}
      </div>
    </div>
  )
}
