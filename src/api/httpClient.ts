import type {
  DownloadPayload,
  FileItem,
  FileShareClient,
  FolderListing,
  Session,
  SharedItem,
  ShareLink,
} from './types'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface HttpFileShareClientOptions {
  baseUrl?: string
  rootFolderId?: string
  fetch?: typeof fetch
}

const SHARE_UNAVAILABLE = 'Share links are not available on the file server yet.'

export class HttpFileShareClient implements FileShareClient {
  private readonly baseUrl: string
  private readonly rootFolderId: string
  private readonly fetchImpl: typeof fetch
  private readonly items = new Map<string, FileItem>()

  constructor(options: HttpFileShareClientOptions = {}) {
    this.baseUrl = trimTrailingSlash(options.baseUrl ?? '')
    this.rootFolderId = options.rootFolderId ?? '1'
    this.fetchImpl = options.fetch ?? fetch.bind(globalThis)
  }

  async login(email: string, password: string): Promise<Session> {
    const username = email.trim()
    if (!username || !password.trim()) throw new Error('Enter your email and password.')

    await this.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    return sessionFromEmail(username)
  }

  async signUp(email: string, password: string): Promise<void> {
    const username = email.trim()
    if (!username || !password.trim()) throw new Error('Enter your email and password.')

    await this.request('/signUp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email: username }),
    })
  }

  async logout(): Promise<void> {
    await this.request('/logout', { method: 'POST' })
  }

  async listFolder(parentId: string | null): Promise<FolderListing> {
    const folderId = parentId ?? this.rootFolderId
    const payload = await this.requestJson(`/entity/${encodeURIComponent(folderId)}/contents`)
    const items = asArray(payload)
      .map((entry) => this.remember(mapEntity(entry)))
      .sort(compareItems)

    if (parentId === null) {
      return { folder: null, breadcrumbs: [], items }
    }

    const folder = this.items.get(parentId) ?? unknownFolder(parentId)
    return {
      folder,
      breadcrumbs: breadcrumbsFor(folder, this.items),
      items,
    }
  }

  async upload(parentId: string | null, file: File): Promise<FileItem> {
    if (!file.name) throw new Error('Choose a file to upload.')
    const folderId = parentId ?? this.rootFolderId

    const created = await this.requestJson(`/entity/${encodeURIComponent(folderId)}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityName: file.name, fileSize: file.size }),
    })
    const item = this.remember({
      ...mapEntity(created),
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      parentId,
    })

    await this.request(fileBytesPath(folderId, item.id), {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })

    return item
  }

  async download(fileId: string): Promise<DownloadPayload> {
    const item = this.items.get(fileId)
    if (!item) throw new Error('Open the file’s folder before downloading it.')
    if (item.kind !== 'file') throw new Error('Folders cannot be downloaded.')

    const folderId = item.parentId ?? this.rootFolderId
    const response = await this.request(fileBytesPath(folderId, fileId), { method: 'GET' })
    const blob = await response.blob()
    return {
      blob,
      filename: filenameFromDisposition(response.headers.get('Content-Disposition'), item.name),
    }
  }

  async createShare(): Promise<ShareLink> {
    throw new Error(SHARE_UNAVAILABLE)
  }

  async getSharedItem(): Promise<SharedItem> {
    throw new Error(SHARE_UNAVAILABLE)
  }

  private remember(item: FileItem) {
    this.items.set(item.id, item)
    return item
  }

  private async requestJson(path: string, init?: RequestInit): Promise<unknown> {
    const response = await this.request(path, init)
    const text = await response.text()
    if (!text) throw new Error('The file server returned an empty response.')
    return JSON.parse(text) as unknown
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      credentials: 'include',
    })
    if (response.ok) return response

    const detail = (await response.text()).trim()
    throw new ApiError(detail || statusMessage(response.status), response.status)
  }
}

export function mapEntity(raw: unknown): FileItem {
  if (typeof raw === 'string') return mapEntity(parseJavaEntity(raw))

  const record = asRecord(raw)
  if (!record) throw new Error('Unexpected folder entry from the file server.')

  const id = String(read(record, 'id') ?? '')
  if (!id || id === 'undefined') throw new Error('A folder entry was missing an id.')

  const parentRaw = read(record, 'parentId')
  const isFolder = asBoolean(read(record, 'isFolder', 'folder'))
  const createdAt = asTimestamp(read(record, 'createdAt', 'modifiedAt'))

  return {
    id,
    parentId: parentRaw === undefined || parentRaw === null || String(parentRaw) === '0' ? null : String(parentRaw),
    kind: isFolder ? 'folder' : 'file',
    name: String(read(record, 'entityName', 'name') ?? 'Untitled'),
    size: Number(read(record, 'fileSize', 'size') ?? 0) || 0,
    mimeType: isFolder ? 'inode/directory' : String(read(record, 'mimeType') ?? 'application/octet-stream'),
    modifiedAt: createdAt,
  }
}

function parseJavaEntity(value: string): Record<string, string> {
  const inner = value.match(/^Entity\[(.*)]$/s)?.[1]
  if (!inner) throw new Error('Unexpected folder entry from the file server.')

  const fields: Record<string, string> = {}
  for (const part of inner.split(', ')) {
    const separator = part.indexOf('=')
    if (separator === -1) continue
    fields[part.slice(0, separator)] = part.slice(separator + 1)
  }
  return fields
}

function breadcrumbsFor(folder: FileItem, items: Map<string, FileItem>) {
  const breadcrumbs: FileItem[] = []
  let current: FileItem | undefined = folder
  const seen = new Set<string>()
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    breadcrumbs.unshift(current)
    current = current.parentId ? items.get(current.parentId) : undefined
  }
  return breadcrumbs
}

function unknownFolder(id: string): FileItem {
  return {
    id,
    parentId: null,
    kind: 'folder',
    name: 'Folder',
    size: 0,
    mimeType: 'inode/directory',
    modifiedAt: new Date(0).toISOString(),
  }
}

function compareItems(a: FileItem, b: FileItem) {
  if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
  return a.name.localeCompare(b.name)
}

function sessionFromEmail(email: string): Session {
  const name = email.split('@')[0].replace(/[._-]/g, ' ')
  return {
    token: 'cookie',
    user: {
      id: `user-${email.toLowerCase()}`,
      name: name.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      email: email.toLowerCase(),
    },
  }
}

function fileBytesPath(folderId: string, fileId: string) {
  // EntityHandler splits the path on "/" and requires six segments for file bytes,
  // so the trailing slash is required: /entity/{folderId}/files/{fileId}/
  return `/entity/${encodeURIComponent(folderId)}/files/${encodeURIComponent(fileId)}/`
}

function filenameFromDisposition(header: string | null, fallback: string) {
  if (!header) return fallback
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encoded) return decodeURIComponent(encoded)
  const quoted = header.match(/filename="([^"]+)"/i)?.[1]
  if (quoted) return quoted
  return header.match(/filename=([^;]+)/i)?.[1]?.trim() ?? fallback
}

function statusMessage(status: number) {
  if (status === 401) return 'Username and password don’t match.'
  if (status === 400) return 'The file server rejected that request.'
  if (status === 403) return 'You don’t have access to this item.'
  if (status === 404) return 'This item no longer exists.'
  return `The file server returned ${status}.`
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  throw new Error('The file server did not return a folder listing.')
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function read(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null && value !== 'null') return value
  }
  return undefined
}

function asBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return false
}

function asTimestamp(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value).toISOString()
  if (typeof value === 'string' && value.trim()) {
    if (/^\d+$/.test(value)) return new Date(Number(value)).toISOString()
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  }
  return new Date(0).toISOString()
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}
