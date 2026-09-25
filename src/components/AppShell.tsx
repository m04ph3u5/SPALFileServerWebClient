import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Icon } from './Icon'

export function Brand() {
  return (
    <div className="brand" aria-label="SyncSpace">
      <span className="brand-mark"><span /></span>
      <span>SyncSpace</span>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth()
  const initials = session?.user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Brand />
        <nav aria-label="File navigation">
          <NavLink to="/files" end>
            <Icon name="folder" size={18} /> My files
          </NavLink>
          <NavLink to="/files/shared">
            <Icon name="shared" size={18} /> Shared with me
          </NavLink>
        </nav>
        <div className="storage-card">
          <div className="storage-heading">
            <span>Storage</span><span>2.4 GB of 10 GB</span>
          </div>
          <div className="storage-track"><span /></div>
          <p>24% used</p>
        </div>
        <button className="profile" type="button" onClick={logout}>
          <span className="avatar">{initials || 'SS'}</span>
          <span>
            <strong>{session?.user.name}</strong>
            <small>Sign out</small>
          </span>
        </button>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}
