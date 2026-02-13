# Bitpanda Status — Community Edition

Community-maintained status dashboard for Bitpanda assets and components.

> This project is **not affiliated with Bitpanda**.

**Live Site:** https://bitpandastatus.info

## What It Does
- Shows grouped asset status tables (buy/sell/withdraw/deposit).
- Displays capability flags (stakeable %, fusion, limit order, margin).
- Highlights maintenance/new assets in the asset list.
- Surfaces component update history with pinned active incidents.
- Supports search and filters with URL-synced state for easy sharing.
- Provides SSR metadata and JSON-LD for crawlability.

## Stack
- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- FontAwesome icons

## Architecture (Current)
### Server Side
- `app/page.tsx`
  - `dynamic = 'force-dynamic'`
  - `generateMetadata()`
  - server fetch (`getAssetData()`)
  - server-side `applyUpdatePinning(...)`
  - page JSON-LD
- `app/layout.tsx`
  - root metadata
  - organization JSON-LD
  - optional Plausible analytics
  - optional `CoffeePopup`

### Client Side
- `app/BitpandaStatusClient.tsx` (interactive shell)
- `components/status/`
  - `SearchAndFilters.tsx`
  - `UpdatesSection.tsx`
  - `AssetGroupsSection.tsx`
  - `StatusRenderer.tsx`
- `features/status/hooks/`
  - `useStatusUrlState.ts`
  - `useStatusData.ts`
- `features/status/types.ts`

### Shared Logic
- `lib/api.ts` — fetch + normalize + in-memory cache (60s)
- `lib/contracts.ts` — server/client handoff types
- `lib/status.ts` — status formatting/token helpers

## Data Sources
Configured in `lib/api.ts`:
1. Community API (`/api/settings`, `/api/updates`) via:
   - `STATUS_API_BASE_URL`
   - optional `STATUS_API_SETTINGS_URL`
   - optional `STATUS_API_UPDATES_URL`
2. Bitpanda new-assets endpoint:
   - `BITPANDA_NEW_ASSETS_URL`

Defaults:
- `STATUS_API_BASE_URL=https://bitpandastatus.info`
- `BITPANDA_NEW_ASSETS_URL=https://api.bitpanda.com/v1/prices/assets/new`

## Configuration
Copy `.env.example` to `.env.local`.

```bash
# API Endpoints
STATUS_API_BASE_URL=https://bitpandastatus.info
BITPANDA_NEW_ASSETS_URL=https://api.bitpanda.com/v1/prices/assets/new

# Optional: Override specific API endpoints
# STATUS_API_SETTINGS_URL=https://bitpandastatus.info/api/settings
# STATUS_API_UPDATES_URL=https://bitpandastatus.info/api/updates

# Analytics (Plausible)
NEXT_PUBLIC_PLAUSIBLE_ENABLED=false
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
NEXT_PUBLIC_PLAUSIBLE_SRC=https://plausible.io/js/script.js

# UI Toggles & Donations
NEXT_PUBLIC_COFFEE_ENABLED=false
NEXT_PUBLIC_COFFEE_URL=https://coff.ee/your-handle
NEXT_PUBLIC_CRYPTO_ADDRESS=your-crypto-address

# Branding & SEO
NEXT_PUBLIC_BASE_URL=https://your-site.com
NEXT_PUBLIC_SITE_NAME=Bitpanda Status - Community Edition
NEXT_PUBLIC_SOCIAL_X_URL=https://x.com/your-handle
NEXT_PUBLIC_SOCIAL_X_HANDLE=@your-handle
```

## Local Development
```bash
npm install
npm run dev
```

App runs on **http://localhost:3002**.

## Forking this Project
This project is designed to be easily forkable. To get started:
1. **Fork** the repository on GitHub.
2. **Clone** your fork locally.
3. **Configure** your environment:
   - Copy `.env.example` to `.env.local`.
   - Update `NEXT_PUBLIC_BASE_URL` to your deployment URL.
   - Set `NEXT_PUBLIC_SITE_NAME` and social links to your own.
   - (Optional) Enable/Disable features like Plausible or the Donation popup.
4. **Deploy**: The project is ready to be deployed on platforms like Vercel, Netlify, or a custom VPS.

## Scripts
- `npm run dev` — start dev server (`:3002`)
- `npm run lint` — run ESLint
- `npm run build` — create a production build
- `npm run start` — run production server (`:3002`)
- `npm run verify` — run lint + build (Recommended check before pushing/deploying)

## Project Conventions (Important)
- Keep `/` dynamic SSR (`force-dynamic`) and `generateMetadata()` on the server route (`app/page.tsx`).
- Keep server-side update pinning in `app/page.tsx` before rendering client UI.
- Keep URL query parameter keys stable:
  - `search`, `maintenance`, `tradeOnly`, `fullyIntegrated`, `stakeable`, `newAssets`, `fusion`, `limitOrder`, `margin`
- Do not replace primary server data fetch with client-side fetch.

## SSR/SEO Guardrails
This repository keeps a single guardrail contract doc for route-level SSR/SEO behavior:
- `docs/architecture-guardrails.md`

CI (`.github/workflows/verify.yml`) runs lint + build on pushes and pull requests.

## Deployment (Quick)
```bash
npm install
npm run build
npm run start
```

Use a reverse proxy (Nginx/Caddy) for TLS and public domain routing.

## Project Structure
- `app/` — App Router route files + client shell + robots + sitemap
- `components/` — shared UI and status section components
- `features/` — feature-scoped hooks/types (`status/*`)
- `lib/` — API + shared contracts/helpers
- `docs/` — architecture and SSR/SEO guardrail contract
- `public/` — static assets

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md).

## License
[MIT](LICENSE)
