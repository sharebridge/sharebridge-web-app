# sharingbridge-web-app

Professional **order initiation history** dashboard for SharingBridge (Vite + React).

## How it works

| What | How |
|------|-----|
| API URL & user id | Build-time `.env` / Render env (`VITE_*`) |
| JWT | **ModHeader** (default) injects `Authorization` — not entered on the page |
| Data | Auto-loads on open; **Refresh** in the header |

## Quick start

```powershell
cd sharingbridge-web-app
copy .env.example .env
npm install
npm run dev
```

1. Set integration `WEB_CORS_ORIGINS=http://localhost:5173` and redeploy.
2. Mint JWT from user-service; add to **ModHeader** as `Bearer <token>`.
3. Open http://localhost:5173 → **Refresh**.

Expand **Authentication setup** on the page for step-by-step ModHeader instructions.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server (port 5173) |
| `npm run build` | Production bundle → `dist/` |
| `npm test` | Unit tests |

## Docs

[configuration/web-client.md](https://github.com/sharingbridge/sharingbridge/blob/main/configuration/web-client.md)

## License

MIT — see [LICENSE](LICENSE).
