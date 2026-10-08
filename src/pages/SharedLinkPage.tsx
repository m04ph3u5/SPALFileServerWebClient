import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApi } from '../api/context'
import type { SharedItem } from '../api/types'
import { Brand } from '../components/AppShell'
import { Icon } from '../components/Icon'
import { formatBytes, formatDate } from '../lib/format'

export function SharedLinkPage() {
  const api = useApi()
  const { token = '' } = useParams()
  const [shared, setShared] = useState<SharedItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    api.getSharedItem(token).then(setShared).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'This link could not be opened.')
    })
  }, [api, token])

  const download = async () => {
    if (!shared) return
    setDownloading(true)
    try {
      const payload = await api.download(shared.item.id)
      const url = URL.createObjectURL(payload.blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = payload.filename
      anchor.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <main className="shared-page">
      <header><Brand /><Link to="/login">Open SyncSpace</Link></header>
      <section className="shared-card">
        {error ? (
          <>
            <span className="shared-file-icon error"><Icon name="close" size={30} /></span>
            <p className="eyebrow">LINK UNAVAILABLE</p>
            <h1>We can’t open this file</h1>
            <p>{error}</p>
          </>
        ) : !shared ? (
          <div className="loading-state" aria-label="Loading shared file"><span /><span /><span /></div>
        ) : (
          <>
            <span className="shared-file-icon"><Icon name="file" size={32} /></span>
            <p className="eyebrow">SHARED WITH YOU</p>
            <h1>{shared.item.name}</h1>
            <p>{formatBytes(shared.item.size)} · Updated {formatDate(shared.item.modifiedAt)}</p>
            <button className="primary-button" disabled={downloading} type="button" onClick={download}>
              <Icon name="download" size={18} />
              {downloading ? 'Preparing…' : 'Download file'}
            </button>
            <small>No account is required to download this file.</small>
          </>
        )}
      </section>
      <footer>Shared securely with SyncSpace</footer>
    </main>
  )
}
