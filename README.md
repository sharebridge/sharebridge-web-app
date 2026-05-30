# sharingbridge-web-app

**Order initiation history** dashboard for SharingBridge (Vite + React).

## How it works

| Step | What |
|------|------|
| Build | Vite bundles the React UI → static `dist/` |
| Sign in | Google (GIS) → user-service → JWT in sessionStorage; optional **Use a different Google account** after a prior sign-in on this browser |
| Data | Dashboard calls integration-service with Bearer token |

## Quick start

```powershell
cd sharingbridge-web-app
copy .env.example .env
npm install
npm run dev
```

Set `WEB_CORS_ORIGINS=http://localhost:5173` on **both** user-service and integration-service. Configure Google and seed the coordinator role per [web-client.md](https://github.com/sharingbridge/sharingbridge/blob/main/configuration/web-client.md) and [coordinator-seed.sql](https://github.com/sharingbridge/sharingbridge/blob/main/configuration/coordinator-seed.sql), then open http://localhost:5173 and **Sign in with Google**.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 5173) |
| `npm run build` | Production `dist/` |
| `npm test` | Unit tests |

## Docs

[configuration/web-client.md](https://github.com/sharingbridge/sharingbridge/blob/main/configuration/web-client.md)

## License

MIT — see [LICENSE](LICENSE).
