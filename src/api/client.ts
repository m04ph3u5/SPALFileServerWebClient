import { HttpFileShareClient } from './httpClient'
import { MockFileShareClient } from './mockClient'
import type { FileShareClient } from './types'

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
export const rootFolderId = import.meta.env.VITE_ROOT_FOLDER_ID ?? '1'

export function createFileShareClient(): FileShareClient {
  if (shouldUseMockApi()) return new MockFileShareClient()

  return new HttpFileShareClient({
    baseUrl: apiBaseUrl ?? '',
    rootFolderId,
  })
}

function shouldUseMockApi() {
  const flag = import.meta.env.VITE_USE_MOCK_API
  if (flag === 'true') return true
  if (flag === 'false') return false
  // Local development has no file server unless one is opted into.
  return import.meta.env.MODE !== 'production'
}
