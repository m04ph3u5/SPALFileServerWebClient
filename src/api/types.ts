export type ItemKind = 'file' | 'folder'

export interface FileItem {
  id: string
  parentId: string | null
  kind: ItemKind
  name: string
  size: number
  mimeType: string
  modifiedAt: string
}

export interface FolderListing {
  folder: FileItem | null
  breadcrumbs: FileItem[]
  items: FileItem[]
}

export interface User {
  id: string
  name: string
  email: string
}

export interface Session {
  token: string
  user: User
}

export interface DownloadPayload {
  blob: Blob
  filename: string
}

export interface ShareLink {
  token: string
  itemId: string
  url: string
  createdAt: string
  expiresAt: string | null
}

export interface SharedItem {
  item: FileItem
  share: ShareLink
}

export interface FileShareClient {
  login(email: string, password: string): Promise<Session>
  signUp(email: string, password: string): Promise<void>
  logout(): Promise<void>
  listFolder(parentId: string | null): Promise<FolderListing>
  upload(parentId: string | null, file: File): Promise<FileItem>
  download(fileId: string): Promise<DownloadPayload>
  createShare(fileId: string, options?: { expiresAt?: string }): Promise<ShareLink>
  getSharedItem(token: string): Promise<SharedItem>
}
