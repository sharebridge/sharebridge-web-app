# sharingbridge-web-app

Browser dashboard for **order initiation history** (MVP).

## Features (shipped)

- Connect with integration-service URL + donor JWT (minted from user-service)
- List and detail view for `GET /v1/donor-seeker/order-intents`
- Session-only token storage (`sessionStorage`)

## Prerequisites

- **integration-service** with `GET /v1/donor-seeker/order-intents` deployed
- **CORS:** set `WEB_CORS_ORIGINS` on integration-service to this app’s origin, e.g. `http://localhost:5173` for local dev

## Local development

```powershell
cd sharingbridge-web-app
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173. Mint a JWT:

```powershell
$token = (Invoke-RestMethod -Method POST -Uri "https://sharingbridge-user-service.onrender.com/v1/auth/token" `
  -ContentType "application/json" -Body '{"user_id":"demo-user"}').token
```

Paste the token into the web form with the same user id and integration URL.

## Build

```powershell
npm run build
npm run preview
```

Static output: `dist/`.

## Tests

```powershell
npm test
```

## Docs

- [configuration/web-client.md](https://github.com/sharingbridge/sharingbridge/blob/main/configuration/web-client.md)
- [MANUAL_TESTING_GUIDE.md](https://github.com/sharingbridge/sharingbridge/blob/main/testing/MANUAL_TESTING_GUIDE.md) §3h

## License

MIT — see [LICENSE](LICENSE).
