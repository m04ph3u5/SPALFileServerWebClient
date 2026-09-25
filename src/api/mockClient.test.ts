import { beforeEach, describe, expect, it } from 'vitest'
import { MockFileShareClient } from './mockClient'

describe('MockFileShareClient', () => {
  beforeEach(() => localStorage.clear())

  it('lists seeded folders before files', async () => {
    const client = new MockFileShareClient()
    const listing = await client.listFolder(null)

    expect(listing.folder).toBeNull()
    expect(listing.items[0]).toMatchObject({ kind: 'folder', name: 'Photos' })
    expect(listing.items.at(-1)).toMatchObject({ kind: 'file', name: 'Welcome.txt' })
  })

  it('uploads and downloads a file in the selected folder', async () => {
    const client = new MockFileShareClient()
    const file = new File(['prototype content'], 'notes.txt', { type: 'text/plain' })

    const uploaded = await client.upload('folder-projects', file)
    const listing = await client.listFolder('folder-projects')
    const download = await client.download(uploaded.id)

    expect(listing.breadcrumbs.map((item) => item.name)).toEqual(['Projects'])
    expect(listing.items).toContainEqual(uploaded)
    expect(download.filename).toBe('notes.txt')
    expect(await download.blob.text()).toBe('prototype content')
  })

  it('creates a durable public share link', async () => {
    const client = new MockFileShareClient()
    const created = await client.createShare('file-welcome')
    const reloadedClient = new MockFileShareClient()
    const shared = await reloadedClient.getSharedItem(created.token)

    expect(created.url).toContain(`/s/${created.token}`)
    expect(shared.item.name).toBe('Welcome.txt')
    expect(shared.share.itemId).toBe('file-welcome')
  })
})
