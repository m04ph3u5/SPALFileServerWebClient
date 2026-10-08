import { describe, expect, it, vi } from 'vitest'
import { ApiError, HttpFileShareClient, mapEntity } from './httpClient'

const jsonHeaders = { 'Content-Type': 'application/json' }

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}

function emptyResponse(status: number, body = '') {
  return new Response(body, { status })
}

describe('mapEntity', () => {
  it('maps Java entity JSON onto FileItem', () => {
    expect(
      mapEntity({
        id: 12,
        entityName: 'Notes.txt',
        parentId: 4,
        isFolder: false,
        fileSize: 32,
        createdAt: 1_726_000_000_000,
      }),
    ).toMatchObject({
      id: '12',
      parentId: '4',
      kind: 'file',
      name: 'Notes.txt',
      size: 32,
    })
  })

  it('parses Java Entity toString values', () => {
    expect(mapEntity('Entity[id=3, entityName=Projects, userId=1, parentId=1, isFolder=true, uri=null, fileSize=0, toDelete=false, createdAt=0]')).toMatchObject({
      id: '3',
      parentId: '1',
      kind: 'folder',
      name: 'Projects',
    })
  })
})

describe('HttpFileShareClient', () => {
  it('logs in with username and cookie credentials', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(emptyResponse(200))
    const client = new HttpFileShareClient({ fetch: fetchImpl })

    const session = await client.login('ada@example.com', 'secret')

    expect(session.user.email).toBe('ada@example.com')
    expect(fetchImpl).toHaveBeenCalledWith(
      '/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ username: 'ada@example.com', password: 'secret' }),
      }),
    )
  })

  it('lists the configured root folder when parentId is null', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, [
        { id: 2, entityName: 'Docs', parentId: 1, isFolder: true, fileSize: 0, createdAt: 0 },
        { id: 3, entityName: 'a.txt', parentId: 1, isFolder: false, fileSize: 4, createdAt: 0 },
      ]),
    )
    const client = new HttpFileShareClient({ fetch: fetchImpl, rootFolderId: '1' })

    const listing = await client.listFolder(null)

    expect(fetchImpl).toHaveBeenCalledWith('/entity/1/contents', expect.objectContaining({ credentials: 'include' }))
    expect(listing.folder).toBeNull()
    expect(listing.items.map((item) => item.name)).toEqual(['Docs', 'a.txt'])
  })

  it('creates file metadata then uploads bytes under a trailing slash path', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { id: 42, entityName: 'notes.txt', parentId: 9, isFolder: false, fileSize: 5, createdAt: 0 }))
      .mockResolvedValueOnce(emptyResponse(201))
    const client = new HttpFileShareClient({ fetch: fetchImpl })
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })

    const uploaded = await client.upload('9', file)

    expect(uploaded.id).toBe('42')
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('/entity/9/files')
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ entityName: 'notes.txt', fileSize: 5 }),
    })
    expect(fetchImpl.mock.calls[1]?.[0]).toBe('/entity/9/files/42/')
    expect(fetchImpl.mock.calls[1]?.[1]).toMatchObject({ method: 'POST', body: file })
  })

  it('downloads using the cached parent folder id', async () => {
    const fileBytes = new Uint8Array([1, 2, 3])
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, [{ id: 7, entityName: 'pic.png', parentId: 4, isFolder: false, fileSize: 3, createdAt: 0 }]))
      .mockResolvedValueOnce(new Response(fileBytes, { status: 200, headers: { 'Content-Type': 'application/octet-stream' } }))
    const client = new HttpFileShareClient({ fetch: fetchImpl })
    await client.listFolder('4')

    const download = await client.download('7')

    expect(fetchImpl.mock.calls[1]?.[0]).toBe('/entity/4/files/7/')
    expect(download.filename).toBe('pic.png')
    expect(new Uint8Array(await download.blob.arrayBuffer())).toEqual(fileBytes)
  })

  it('surfaces API errors from the response body', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(emptyResponse(401, 'Username and password don\'t match'))
    const client = new HttpFileShareClient({ fetch: fetchImpl })

    await expect(client.login('ada@example.com', 'nope')).rejects.toBeInstanceOf(ApiError)
  })

  it('does not invent share-link endpoints', async () => {
    const client = new HttpFileShareClient({ fetch: vi.fn() })
    await expect(client.createShare()).rejects.toThrow(/not available/)
    await expect(client.getSharedItem()).rejects.toThrow(/not available/)
  })
})
