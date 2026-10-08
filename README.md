# SyncSpace web prototype

A Vite, React, and TypeScript prototype for browsing, uploading, downloading,
and sharing files.

## Run locally

```bash
npm install
npm run dev
```

Sign in with any non-empty email and password. The mock file database and
session are persisted in the browser's local storage.

## Commands

- `npm run dev` starts the development server.
- `npm test` runs the mock client tests.
- `npm run lint` checks the TypeScript and React code.
- `npm run build` creates a production build.

## Backend integration

UI components depend on the typed `FileShareClient` contract in
`src/api/types.ts`. `npm run dev` uses `HttpFileShareClient` and proxies
`/login`, `/signUp`, `/logout`, and `/entity` to the Java server at
`http://127.0.0.1:8080`. Tests use `MockFileShareClient`.

The HTTP adapter maps the UI methods onto the existing server routes:

- `login` / `signUp` / `logout` → `/login`, `/signUp`, `/logout` (cookie `sessionId`)
- `listFolder` → `GET /entity/{folderId}/contents`
- `upload` → `POST /entity/{folderId}/files` then `POST /entity/{folderId}/files/{id}/`
- `download` → `GET /entity/{folderId}/files/{id}/`

Share links have no server routes yet, so those methods throw.

Environment:

- `VITE_ROOT_FOLDER_ID` — folder id used for “My files” (default `1`)
- `VITE_API_BASE_URL` — API origin; leave unset in development so the Vite proxy is used
- `VITE_USE_MOCK_API=true` — force the in-browser mock client
