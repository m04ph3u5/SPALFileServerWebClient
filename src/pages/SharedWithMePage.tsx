import { AppShell } from '../components/AppShell'
import { Icon } from '../components/Icon'

export function SharedWithMePage() {
  return (
    <AppShell>
      <div className="content-header">
        <div>
          <p className="eyebrow">COLLABORATION</p>
          <h1>Shared with me</h1>
        </div>
      </div>
      <div className="empty-state standalone">
        <span className="empty-icon"><Icon name="shared" size={28} /></span>
        <h2>No shared files yet</h2>
        <p>Files other people share with you will appear here.</p>
      </div>
    </AppShell>
  )
}
