import { useEffect, useRef, useState } from 'react'
import type { FileItem, ShareLink } from '../api/types'
import { Icon } from './Icon'

export function ShareDialog({
  item,
  share,
  busy,
  error,
  onCreate,
  onClose,
}: {
  item: FileItem
  share: ShareLink | null
  busy: boolean
  error: string | null
  onCreate: () => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const copyLink = async () => {
    if (!share) return
    await navigator.clipboard.writeText(share.url)
    setCopied(true)
    globalThis.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <dialog ref={dialogRef} className="share-dialog" onCancel={onClose} onClose={onClose}>
      <button className="dialog-close" type="button" aria-label="Close" onClick={onClose}>
        <Icon name="close" size={20} />
      </button>
      <span className="dialog-icon"><Icon name="link" size={22} /></span>
      <h2>Share “{item.name}”</h2>
      <p>Create a public link. Anyone with the link can view the file details and download it.</p>
      {share ? (
        <div className="share-result">
          <label htmlFor="share-link">Share link</label>
          <div>
            <input id="share-link" readOnly value={share.url} />
            <button className="secondary-button" type="button" onClick={copyLink}>
              <Icon name={copied ? 'check' : 'copy'} size={17} />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ) : (
        <button className="primary-button dialog-action" disabled={busy} type="button" onClick={onCreate}>
          {busy ? 'Creating link…' : 'Create share link'}
        </button>
      )}
      {error && <p className="error-message" role="alert">{error}</p>}
    </dialog>
  )
}
