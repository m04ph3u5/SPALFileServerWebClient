import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export function rewriteSetCookiePath(cookie: string) {
  if (/;\s*path=/i.test(cookie)) return cookie.replace(/;\s*path=[^;]*/i, '; Path=/')
  return `${cookie}; Path=/`
}

const fileServerProxy = {
  target: 'http://127.0.0.1:8080',
  changeOrigin: true,
  configure(proxy: { on: (event: string, listener: (proxyRes: { headers: Record<string, string | string[] | undefined> }) => void) => void }) {
    proxy.on('proxyRes', (proxyRes) => {
      const cookies = proxyRes.headers['set-cookie']
      if (!Array.isArray(cookies)) return
      proxyRes.headers['set-cookie'] = cookies.map(rewriteSetCookiePath)
    })
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/health': fileServerProxy,
      '/signUp': fileServerProxy,
      '/login': fileServerProxy,
      '/logout': fileServerProxy,
      '/entity': fileServerProxy,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
