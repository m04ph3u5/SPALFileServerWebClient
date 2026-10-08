/* eslint-disable react-refresh/only-export-components -- provider and hook form one public context API */
import { createContext, useContext, useState, type ReactNode } from 'react'
import { createFileShareClient } from './client'
import type { FileShareClient } from './types'

const ApiContext = createContext<FileShareClient | null>(null)

export function ApiProvider({ children, client }: { children: ReactNode; client?: FileShareClient }) {
  const [fallbackClient] = useState(() => createFileShareClient())
  return <ApiContext.Provider value={client ?? fallbackClient}>{children}</ApiContext.Provider>
}

export function useApi() {
  const client = useContext(ApiContext)
  if (!client) throw new Error('useApi must be used inside ApiProvider.')
  return client
}
