import { MockFileShareClient } from './mockClient'
import type { FileShareClient } from './types'

/**
 * Adapter boundary for the backend integration.
 *
 * VITE_API_BASE_URL is intentionally reserved for the future HTTP adapter.
 * The backend repository is not accessible in this workspace, so selecting a
 * made-up REST contract here would make that integration harder, not easier.
 */
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

export function createFileShareClient(): FileShareClient {
  return new MockFileShareClient()
}
