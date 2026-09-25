import type { FileItem } from '../api/types'
import { Icon } from './Icon'

export function Breadcrumbs({
  items,
  onNavigate,
}: {
  items: FileItem[]
  onNavigate: (id: string | null) => void
}) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <button type="button" onClick={() => onNavigate(null)}>My files</button>
      {items.map((item) => (
        <span key={item.id}>
          <Icon name="chevron" size={14} />
          <button type="button" onClick={() => onNavigate(item.id)}>{item.name}</button>
        </span>
      ))}
    </nav>
  )
}
