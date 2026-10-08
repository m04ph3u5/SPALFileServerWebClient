import type { FileItem } from '../api/types'
import { formatBytes, formatDate } from '../lib/format'
import { Icon } from './Icon'

export function FileTable({
  items,
  onOpen,
  onDownload,
  onShare,
}: {
  items: FileItem[]
  onOpen: (item: FileItem) => void
  onDownload: (item: FileItem) => void
  onShare: (item: FileItem) => void
}) {
  if (!items.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon"><Icon name="folder" size={28} /></span>
        <h2>This folder is empty</h2>
        <p>Drop a file here or use the upload button to get started.</p>
      </div>
    )
  }

  return (
    <div className="file-table-wrap">
      <table className="file-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Modified</th>
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <button className="file-name" type="button" onClick={() => onOpen(item)}>
                  <span className={`item-icon ${item.kind}`}>
                    <Icon name={item.kind} size={20} />
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.kind === 'folder' ? 'Folder' : item.mimeType}</small>
                  </span>
                </button>
              </td>
              <td>{formatBytes(item.size)}</td>
              <td>{formatDate(item.modifiedAt)}</td>
              <td>
                <div className="row-actions">
                  {item.kind === 'file' && (
                    <>
                      <button type="button" title={`Download ${item.name}`} onClick={() => onDownload(item)}>
                        <Icon name="download" size={18} />
                      </button>
                      <button type="button" title={`Share ${item.name}`} onClick={() => onShare(item)}>
                        <Icon name="link" size={18} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
