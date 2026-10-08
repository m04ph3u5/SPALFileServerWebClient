import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { ApiProvider } from './api/context'
import { MockFileShareClient } from './api/mockClient'
import { AuthProvider } from './auth/AuthContext'

function renderApp(client: MockFileShareClient, route = '/login') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ApiProvider client={client}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ApiProvider>
    </MemoryRouter>,
  )
}

describe('file sharing flows', () => {
  beforeEach(() => localStorage.clear())

  it('signs in, browses a folder, uploads a file, and creates a share link', async () => {
    const user = userEvent.setup()
    const client = new MockFileShareClient()
    renderApp(client)

    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByRole('heading', { name: 'My files' })).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: /projects/i }))
    expect(await screen.findByText('Roadmap.md')).toBeInTheDocument()

    const uploadInput = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(uploadInput).not.toBeNull()
    await user.upload(uploadInput!, new File(['hello'], 'prototype.txt', { type: 'text/plain' }))
    expect(await screen.findByText('prototype.txt')).toBeInTheDocument()

    await user.click(screen.getByTitle('Share prototype.txt'))
    await user.click(screen.getByRole('button', { name: 'Create share link' }))
    await waitFor(() => {
      expect((screen.getByLabelText('Share link') as HTMLInputElement).value).toContain('/s/')
    })
  })

  it('opens a public share without a session', async () => {
    const client = new MockFileShareClient()
    const share = await client.createShare('file-welcome')

    renderApp(client, `/s/${share.token}`)

    expect(await screen.findByRole('heading', { name: 'Welcome.txt' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download file/i })).toBeInTheDocument()
  })
})
