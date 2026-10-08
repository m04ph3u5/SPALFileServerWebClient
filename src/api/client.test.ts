import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFileShareClient } from './client'
import { HttpFileShareClient } from './httpClient'
import { MockFileShareClient } from './mockClient'

describe('createFileShareClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses the in-browser mock while developing', () => {
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('VITE_USE_MOCK_API', '')
    expect(createFileShareClient()).toBeInstanceOf(MockFileShareClient)
  })

  it('uses the HTTP client for a production build', () => {
    vi.stubEnv('MODE', 'production')
    vi.stubEnv('VITE_USE_MOCK_API', '')
    expect(createFileShareClient()).toBeInstanceOf(HttpFileShareClient)
  })

  it('uses the HTTP client when the mock is turned off', () => {
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('VITE_USE_MOCK_API', 'false')
    expect(createFileShareClient()).toBeInstanceOf(HttpFileShareClient)
  })
})
