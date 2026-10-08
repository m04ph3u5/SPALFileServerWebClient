import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../components/AppShell'
import { useAuth } from '../auth/AuthContext'
import { Icon } from '../components/Icon'

export function LoginPage() {
  const { session, login, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('alex@syncspace.test')
  const [password, setPassword] = useState('prototype')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session) return <Navigate to="/files" replace />

  const finish = async (action: 'login' | 'signUp') => {
    setBusy(true)
    setError(null)
    try {
      if (action === 'signUp') await signUp(email, password)
      else await login(email, password)
      const target = (location.state as { from?: string } | null)?.from ?? '/files'
      navigate(target, { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await finish('login')
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <Brand />
        <div>
          <p className="eyebrow">YOUR FILES, EVERYWHERE</p>
          <h1>Keep your work in sync.</h1>
          <p>Store, access, and share files from every device. Simple, private, and always available.</p>
          <div className="feature-list">
            <span><Icon name="check" size={17} /> Access files anywhere</span>
            <span><Icon name="check" size={17} /> Share with one secure link</span>
          </div>
        </div>
        <small>SyncSpace prototype</small>
      </section>
      <section className="login-panel">
        <form className="login-form" onSubmit={submit}>
          <span className="mobile-brand"><Brand /></span>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to SyncSpace</h2>
          <p>Sign in with your account, or create one if this is your first visit.</p>
          <label>
            Email address
            <input
              required
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              required
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="login-actions">
            <button className="primary-button login-submit" disabled={busy} type="submit">
              {busy ? 'Signing in…' : 'Sign in'} <Icon name="arrow" size={18} />
            </button>
            <button
              className="secondary-button"
              disabled={busy}
              type="button"
              onClick={() => void finish('signUp')}
            >
              {busy ? 'Working…' : 'Create account'}
            </button>
          </div>
          <small>The file server keeps your session in a cookie.</small>
        </form>
      </section>
    </main>
  )
}
