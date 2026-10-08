import type {
  DownloadPayload,
  FileItem,
  FileShareClient,
  FolderListing,
  Session,
  SharedItem,
  ShareLink,
} from './types'

interface StoredItem extends FileItem {
  content?: string
}

interface MockDatabase {
  items: StoredItem[]
  shares: ShareLink[]
}

const metadataOf = (item: StoredItem): FileItem => ({
  id: item.id,
  parentId: item.parentId,
  kind: item.kind,
  name: item.name,
  size: item.size,
  mimeType: item.mimeType,
  modifiedAt: item.modifiedAt,
})

const DATABASE_KEY = 'syncspace.mock.database.v1'
const delay = (milliseconds = 180) =>
  new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds))

const seedDatabase = (): MockDatabase => ({
  items: [
    {
      id: 'folder-projects',
      parentId: null,
      kind: 'folder',
      name: 'Projects',
      size: 0,
      mimeType: 'inode/directory',
      modifiedAt: '2026-09-15T14:20:00.000Z',
    },
    {
      id: 'folder-photos',
      parentId: null,
      kind: 'folder',
      name: 'Photos',
      size: 0,
      mimeType: 'inode/directory',
      modifiedAt: '2026-09-12T09:15:00.000Z',
    },
    {
      id: 'file-welcome',
      parentId: null,
      kind: 'file',
      name: 'Welcome.txt',
      size: 94,
      mimeType: 'text/plain',
      modifiedAt: '2026-09-16T08:45:00.000Z',
      content: 'Welcome to SyncSpace.\n\nUpload a file, browse your folders, or create a link to share.',
    },
    {
      id: 'file-roadmap',
      parentId: 'folder-projects',
      kind: 'file',
      name: 'Roadmap.md',
      size: 138,
      mimeType: 'text/markdown',
      modifiedAt: '2026-09-14T11:30:00.000Z',
      content: '# Roadmap\n\nA sample file stored in the Projects folder.',
    },
  ],
  shares: [],
})

const encodeFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('The selected file could not be read.'))
    reader.readAsDataURL(file)
  })

const contentToBlob = (content: string | undefined, mimeType: string): Blob => {
  if (!content) return new Blob([], { type: mimeType })
  if (!content.startsWith('data:')) return new Blob([content], { type: mimeType })

  const [header, encoded = ''] = content.split(',', 2)
  const type = header.match(/^data:([^;]+)/)?.[1] ?? mimeType
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new Blob([bytes], { type })
}

export class MockFileShareClient implements FileShareClient {
  private database: MockDatabase

  constructor(private readonly storage: Storage | null = globalThis.localStorage ?? null) {
    const stored = this.storage?.getItem(DATABASE_KEY)
    try {
      this.database = stored ? (JSON.parse(stored) as MockDatabase) : seedDatabase()
    } catch {
      this.database = seedDatabase()
    }
    this.persist()
  }

  private persist() {
    this.storage?.setItem(DATABASE_KEY, JSON.stringify(this.database))
  }

  private getItem(id: string) {
    const item = this.database.items.find((candidate) => candidate.id === id)
    if (!item) throw new Error('This item no longer exists.')
    return item
  }

  async login(email: string, password: string): Promise<Session> {
    await delay()
    if (!email.trim() || !password.trim()) throw new Error('Enter your email and password.')
    const name = email.split('@')[0].replace(/[._-]/g, ' ')
    return {
      token: crypto.randomUUID(),
      user: {
        id: `user-${email.toLowerCase()}`,
        name: name.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        email: email.toLowerCase(),
      },
    }
  }

  async signUp(email: string, password: string): Promise<void> {
    await delay()
    if (!email.trim() || !password.trim()) throw new Error('Enter your email and password.')
  }

  async logout(): Promise<void> {
    await delay(40)
  }

  async listFolder(parentId: string | null): Promise<FolderListing> {
    await delay()
    const folder = parentId ? this.getItem(parentId) : null
    if (folder?.kind === 'file') throw new Error('A file cannot be opened as a folder.')

    const breadcrumbs: FileItem[] = []
    let current: StoredItem | null = folder
    while (current) {
      breadcrumbs.unshift(current)
      current = current.parentId ? this.getItem(current.parentId) : null
    }

    return {
      folder,
      breadcrumbs,
      items: this.database.items
        .filter((item) => item.parentId === parentId)
        .sort((a, b) => {
          if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
          return a.name.localeCompare(b.name)
        })
        .map(metadataOf),
    }
  }

  async upload(parentId: string | null, file: File): Promise<FileItem> {
    if (parentId) {
      const parent = this.getItem(parentId)
      if (parent.kind !== 'folder') throw new Error('Uploads require a valid folder.')
    }
    if (!file.name) throw new Error('Choose a file to upload.')

    const content = await encodeFile(file)
    await delay(350)
    const item: StoredItem = {
      id: crypto.randomUUID(),
      parentId,
      kind: 'file',
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      modifiedAt: new Date().toISOString(),
      content,
    }
    this.database.items.push(item)
    this.persist()
    return metadataOf(item)
  }

  async download(fileId: string): Promise<DownloadPayload> {
    await delay()
    const item = this.getItem(fileId)
    if (item.kind !== 'file') throw new Error('Folders cannot be downloaded in this prototype.')
    return {
      blob: contentToBlob(item.content, item.mimeType),
      filename: item.name,
    }
  }

  async createShare(itemId: string, options?: { expiresAt?: string }): Promise<ShareLink> {
    await delay()
    this.getItem(itemId)
    const existing = this.database.shares.find((share) => share.itemId === itemId)
    if (existing) return existing

    const token = crypto.randomUUID()
    const share: ShareLink = {
      token,
      itemId,
      url: `${globalThis.location?.origin ?? ''}/s/${token}`,
      createdAt: new Date().toISOString(),
      expiresAt: options?.expiresAt ?? null,
    }
    this.database.shares.push(share)
    this.persist()
    return share
  }

  async getSharedItem(token: string): Promise<SharedItem> {
    await delay()
    const share = this.database.shares.find((candidate) => candidate.token === token)
    if (!share) throw new Error('This share link is invalid or has been removed.')
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      throw new Error('This share link has expired.')
    }
    return { item: metadataOf(this.getItem(share.itemId)), share }
  }
}
