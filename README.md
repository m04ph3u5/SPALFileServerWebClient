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
`src/api/types.ts`. The current adapter is `MockFileShareClient`; it can be
replaced by an HTTP implementation once the backend route definitions are
available. `VITE_API_BASE_URL` is reserved for that adapter.
