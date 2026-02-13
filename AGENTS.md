# Project Overview
This repository contains a **Next.js 16 (App Router)** application powering the Bitpanda Status “Community Edition” site.

This project is community-maintained and **not affiliated with Bitpanda**.

It shows:
- asset availability (buy/sell/withdraw/deposit)
- feature capability flags (staking, fusion, limit order, margin)
- recent component updates with server-side pinning for active incidents

# Tech Stack
- **Framework**: Next.js `16.1.4` (App Router)
- **Language**: TypeScript
- **UI**: React `19.2.3`
- **Styling**: Tailwind CSS v4
- **Icons**: FontAwesome (`@fortawesome/react-fontawesome`)
- **Build/runtime checks**: ESLint + production build
- **Compiler**: React Compiler enabled in `next.config.ts`

# Architecture
## Server Boundary (Must Stay Server-Side)
- **`app/page.tsx`**
  - `export const dynamic = 'force-dynamic'`
  - `generateMetadata()`
  - server fetch via `getAssetData()`
  - server-side `applyUpdatePinning(...)`
  - page-level JSON-LD injection
- **`app/layout.tsx`**
  - root metadata
  - organization JSON-LD
  - optional Plausible script + optional `CoffeePopup`

## Client UI Boundary
- **`app/BitpandaStatusClient.tsx`**: client shell for interactive UI state
- **`components/status/`**
  - `SearchAndFilters.tsx`
  - `UpdatesSection.tsx`
  - `AssetGroupsSection.tsx`
  - `StatusRenderer.tsx`
- **`features/status/hooks/`**
  - `useStatusUrlState.ts` (URL/query-state sync)
  - `useStatusData.ts` (filter/group/update memoization)
- **`features/status/types.ts`**: filter keys and labels

## Shared Domain Logic
- **`lib/api.ts`**: remote fetching + normalization + 60s in-memory cache
- **`lib/contracts.ts`**: server/client handoff types
- **`lib/status.ts`**: status text/token helpers

# Data Sources
`lib/api.ts` fetches from:
1. **Community API**
   - `STATUS_API_BASE_URL` (default: `https://bitpandastatus.info`)
   - optional overrides:
     - `STATUS_API_SETTINGS_URL`
     - `STATUS_API_UPDATES_URL`
2. **Bitpanda API**
   - `BITPANDA_NEW_ASSETS_URL` (default: `https://api.bitpanda.com/v1/prices/assets/new`)

Implementation details:
- upstream requests use `cache: 'no-store'`
- normalized result is cached in-memory for 60s (`fetchWithCache('assetData', 60, ...)`)
- update payloads normalize both string/object status formats
- description payloads (including structured objects) are flattened for rendering

# Project Conventions (Do Not Break)
1. Keep `/` dynamic SSR (`force-dynamic`) and preserve server metadata generation.
2. Keep server-side update pinning semantics in `app/page.tsx`.
3. Preserve URL query parameter keys and semantics:
   - `search`, `maintenance`, `tradeOnly`, `fullyIntegrated`, `stakeable`, `newAssets`, `fusion`, `limitOrder`, `margin`
4. Do not replace server primary data fetch with client-side fetch.
5. Keep both JSON-LD script injections (layout + page).

# SSR/SEO Guardrails & Docs
- Single contract doc: `docs/architecture-guardrails.md`

# Commands
- `npm run dev` — start dev server on port `3002`
- `npm run lint` — run ESLint
- `npm run build` — production build
- `npm run start` — run production server on port `3002`
- `npm run verify` — lint + build
