import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../api/context'
import type { FileItem, FolderListing, ShareLink } from '../api/types'
import { AppShell } from '../components/AppShell'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { FileTable } from '../components/FileTable'
import { ShareDialog } from '../components/ShareDialog'
import { UploadDropzone } from '../components/UploadDropzone'

export function FilesPage() {
  const api = useApi()
  const navigate = useNavigate()
  const { folderId } = useParams()
  const currentFolderId = folderId ?? null
  const [listing, setListing] = useState<FolderListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareItem, setShareItem] = useState<FileItem | null>(null)
  const [share, setShare] = useState<ShareLink | null>(null)
  const [sharing, setSharing] = useState(false)

  const loadFolder = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setListing(await api.listFolder(currentFolderId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load this folder.')
    } finally {
      setLoading(false)
    }
  }, [api, currentFolderId])

  useEffect(() => {
    let active = true
    api.listFolder(currentFolderId)
      .then((nextListing) => {
        if (active) setListing(nextListing)
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Could not load this folder.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [api, currentFolderId])

  const upload = async (files: File[]) => {
    if (!files.length) return
    setUploading(true)
    setError(null)
    try {
      for (const file of files) await api.upload(currentFolderId, file)
      await loadFolder()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const download = async (item: FileItem) => {
    setError(null)
    try {
      const payload = await api.download(item.id)
      const url = URL.createObjectURL(payload.blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = payload.filename
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Download failed.')
    }
  }

  const createShare = async () => {
    if (!shareItem) return
    setSharing(true)
    setError(null)
    try {
      setShare(await api.createShare(shareItem.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the link.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <AppShell>
      <div className="content-header">
        <div>
          <p className="eyebrow">PERSONAL SPACE</p>
          <h1>{listing?.folder?.name ?? 'My files'}</h1>
        </div>
        <UploadDropzone uploading={uploading} onUpload={upload} />
      </div>

      <Breadcrumbs
        items={listing?.breadcrumbs ?? []}
        onNavigate={(id) => navigate(id ? `/files/${id}` : '/files')}
      />

      {error && !shareItem && <p className="page-error" role="alert">{error}</p>}
      {loading ? (
        <div className="loading-state" aria-label="Loading files">
          <span /><span /><span />
        </div>
      ) : (
        <FileTable
          items={listing?.items ?? []}
          onOpen={(item) => item.kind === 'folder' && navigate(`/files/${item.id}`)}
          onDownload={download}
          onShare={(item) => {
            setShareItem(item)
            setShare(null)
            setError(null)
          }}
        />
      )}

      {shareItem && (
        <ShareDialog
          item={shareItem}
          share={share}
          busy={sharing}
          error={error}
          onCreate={createShare}
          onClose={() => {
            setShareItem(null)
            setShare(null)
            setError(null)
          }}
        />
      )}
    </AppShell>
  )
}
