# sharingbridge-web-app

**Initiations** dashboard for SharingBridge (Vite + React) — coordinator and payee views.

## How it works

| Step | What |
|------|------|
| Build | Vite → static `dist/` |
| Sign in | Google (GIS) → user-service → JWT |
| Tabs | **Initiations** \| **Actions** \| **Map** |
| Actions | Pledges, demand lines, kitchen commitments (`GET /v1/demand/board`) |
| Banner | Data boundaries (time, area, sort, limit) |

Product flows: [Eco_Kitchen_Initiation_Flow.md](https://github.com/sharingbridge/sharingbridge/blob/main/design/Eco_Kitchen_Initiation_Flow.md).

## Quick start

```powershell
cd sharingbridge-web-app
copy .env.example .env
npm install
npm run dev
```

Set `WEB_CORS_ORIGINS=http://localhost:5173` on user-service and integration-service. See [web-client.md](https://github.com/sharingbridge/sharingbridge/blob/main/configuration/web-client.md).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 5173) |
| `npm run build` | Production `dist/` |
| `npm test` | Unit tests |

## License

MIT — see [LICENSE](LICENSE).
