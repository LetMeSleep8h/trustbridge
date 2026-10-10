<div align="center">

# TrustBridge

**Transparent humanitarian aid donations on the Stellar blockchain.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Stellar](https://img.shields.io/badge/built%20on-Stellar-black.svg)](https://stellar.org)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Report a bug](../../issues/new/choose)

</div>

---

## Overview

TrustBridge connects donors with humanitarian campaigns and makes every contribution traceable. Donors browse campaigns, connect a Stellar wallet, and follow transactions publicly on the ledger. Campaign creators publish a goal and receive donations directly to their own wallet. Administrators can deactivate campaigns that break the platform's guidelines.

> **Project status: active development.** Accounts, campaigns, wallets, transaction history and notifications work today. **On-chain donations and sending are not wired up yet**; the Donate and Send screens run in clearly labelled *preview mode*, and the backend verification they will use is already in place. See [Status](#status) for the full picture.

## Status

| Area | State | Notes |
| --- | --- | --- |
| Email and password accounts (JWT) | Working | bcrypt hashing, rate-limited login |
| GitHub sign-in | Working | Verified emails only, CSRF `state` check |
| Browse and search campaigns | Working | Search is debounced and API-backed |
| Create campaigns with image upload | Working | Cloudinary; validation on server |
| Freighter wallet | Working | Detect, connect, balance |
| Lobstr wallet | Working | Detect and connect |
| Transaction history, filters, CSV export | Working | Paginated; CSV is formula-safe |
| Email notifications (Resend) | Working | Signed one-click unsubscribe |
| Admin dashboard (`/admin`) | Working | Stats, campaign list, deactivate |
| Multilingual UI | Working | English, Spanish, French, Arabic, Chinese |
| **On-chain donations** | **Preview** | Backend verifies signed transactions; UI signing flow still to build |
| **Sending XLM** | **Preview** | Same as above |
| Dashboard and Analytics figures | Sample data | Clearly labelled; real aggregates planned |
| xBull, Albedo, WalletConnect | Not started | Open for contribution |
| Two-factor authentication | Not started | Open for contribution |

## How it works

```
 Browser (React SPA)                       Express API                      Stellar
┌──────────────────────┐   HTTPS / JSON   ┌───────────────────┐
│ TanStack Start (SPA) │ ───────────────▶ │ Auth · Campaigns  │
│ Freighter / Lobstr   │                  │ Transactions      │ ───▶  Horizon (testnet or mainnet)
│ extension wallets    │ ◀─────────────── │ Admin · Email     │
└──────────┬───────────┘                  └─────────┬─────────┘
           │ sign transaction (XDR)                 │
           └──────── POST /campaigns/:id/donate ────┤  verifies source, destination
                                                    │  and amount from the signed XDR,
                                                    ▼  then submits and records it
                                              SQLite (better-sqlite3)
```

Donation integrity is enforced on the server: the amount, destination and sender are read from the signed transaction itself, so a client cannot claim a different amount than it actually paid.

## Tech stack

- **Frontend:** React 18, TanStack Start/Router (SPA mode), Vite, TypeScript, Tailwind CSS v4
- **Backend:** Node.js (ESM), Express 4, SQLite via `better-sqlite3`, JWT, bcrypt
- **Blockchain:** Stellar SDK 16, Freighter and Lobstr wallet APIs
- **Services:** Resend (email), Cloudinary (images), GitHub OAuth
- **Testing:** Node's built-in test runner

## Quick start

**Requirements:** Node.js 20 or newer, npm, Git.

```bash
git clone https://github.com/trustbridge-platform/trustbridge.git
cd trustbridge

# 1. API (terminal 1)
cd backend
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run dev                 # http://localhost:5000

# 2. Frontend (terminal 2, from the repository root)
cp .env.example .env.local  # Windows PowerShell: Copy-Item .env.example .env.local
npm install
npm run dev                 # http://localhost:5173
```

The SQLite database is created automatically on first run. Optional services (email, image upload, GitHub sign-in) are skipped when their keys are missing, so you can run the whole app locally with only the defaults. Set `STELLAR_NETWORK=testnet` for development.

### Configuration

All variables are documented in [`backend/.env.example`](backend/.env.example) and [`.env.example`](.env.example).

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | frontend | API base URL, including `/api` |
| `PORT`, `NODE_ENV` | API | Server port and mode |
| `FRONTEND_URL` | API | Allowed CORS origin(s) (comma-separated), OAuth redirect and email links |
| `JWT_SECRET` | API | **Required in production**, at least 32 characters |
| `STELLAR_NETWORK` | API | `testnet` or `mainnet` (defaults to `mainnet`) |
| `EMAIL_API_KEY`, `EMAIL_FROM`, `API_BASE_URL` | API | Resend notifications and unsubscribe links |
| `CLOUDINARY_*` | API | Campaign image upload |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | API | GitHub sign-in |

### Scripts

| Command | Where | Does |
| --- | --- | --- |
| `npm run dev` | root, `backend/` | Start the dev server |
| `npm run build` | root | Production build of the SPA |
| `npm run lint` | root | ESLint |
| `npm test` | `backend/` | Run backend tests |

## API overview

Base path `/api`. Routes marked 🔒 need `Authorization: Bearer <token>`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, 🔒 `GET /auth/me`, 🔒 `PUT /auth/profile`, 🔒 `PUT /auth/notifications`, 🔒 `PUT /auth/change-password`, `GET /auth/unsubscribe` |
| GitHub | `GET /auth/github/url`, `POST /auth/github/callback` |
| Campaigns | `GET /campaigns`, `GET /campaigns/:id`, 🔒 `POST /campaigns`, 🔒 `POST /campaigns/:id/donate` |
| Comments | 🔒 `POST /campaigns/:id/comments`, 🔒 `DELETE /campaigns/:campaignId/comments/:commentId` |
| Transactions | 🔒 `GET /transactions/me`, 🔒 `POST /transactions/send`, 🔒 `GET /transactions/export/csv`, `GET /transactions/balance/:address`, `GET /transactions/balance-history/:address` |
| Admin | 🔒 admin only: `GET /admin/stats`, `GET /admin/campaigns`, `POST /admin/campaigns/:id/deactivate` |
| Health | `GET /health`, `GET /health/ping` |

## Project structure

```
src/                 React app
  routes/            File-based routes (TanStack)
  components/        Layout, modals, shared UI
  services/api.ts    API client
  lib/               Wallet detection and helpers
  i18n/              Translations
backend/
  server.js          Entry point
  src/app.js         Express app, CORS, rate limiting
  src/routes/        auth, oauth, campaigns, transactions, admin, health
  src/models/        SQLite data access
  src/services/      Stellar, email, image upload
  src/middleware/    JWT auth, admin guard, upload
  test/              Node test runner suites
```

## Deployment

TrustBridge runs as two services, for example on [Render](https://render.com):

1. **API** (Web Service, root directory `backend`): build `npm install`, start `node server.js`. Set `NODE_ENV=production`, a strong `JWT_SECRET` and `FRONTEND_URL`. Attach a persistent disk if you need the SQLite data to survive redeploys.
2. **Frontend** (Static Site): build `npm install && npm run build`, publish `.output/public`, and set `VITE_API_URL` to the API URL ending in `/api`. Add a rewrite of `/*` to `/index.html` for client-side routing.

In production the API refuses to start without a valid `JWT_SECRET`.

## Security

- Passwords are hashed with bcrypt; tokens are signed JWTs.
- Login and registration are rate-limited, and login does not reveal whether an email exists.
- GitHub sign-in uses a random `state` and only trusts emails GitHub has verified.
- Donation amounts and destinations are verified from the signed Stellar transaction.
- CSV exports neutralise spreadsheet formulas; user content is escaped in emails.

Found a vulnerability? Please follow [SECURITY.md](SECURITY.md) and do not open a public issue.

## Roadmap

- [ ] Connect the Donate and Send screens to wallet signing and the verified API
- [ ] Additional wallets: xBull, Albedo, WalletConnect
- [ ] Two-factor authentication
- [ ] Real aggregates for the Dashboard and Analytics pages
- [ ] Broader automated test coverage (API integration, frontend)
- [ ] Campaign milestones and fund-release rules

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), pick an issue labelled `good first issue` or `help wanted`, and open a pull request. Everyone participating is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Released under the [MIT License](LICENSE).
