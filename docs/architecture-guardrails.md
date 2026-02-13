# Architecture & SSR/SEO Guardrails

Single-source contract for runtime boundaries, SSR/SEO guarantees, and validation.

## Non-Negotiable Invariants

1. `app/page.tsx` remains server-rendered and keeps:
   - `export const dynamic = 'force-dynamic'`
   - `generateMetadata()`
   - server `getAssetData()` call
   - server `applyUpdatePinning(...)` before client render
2. `app/layout.tsx` keeps root metadata and organization JSON-LD.
3. `app/page.tsx` keeps page JSON-LD.
4. Primary page data is fetched server-side (no client replacement fetch).
5. URL query keys/semantics stay stable:
   - `search`, `maintenance`, `tradeOnly`, `fullyIntegrated`, `stakeable`, `newAssets`, `fusion`, `limitOrder`, `margin`
6. Filter keys in `features/status/types.ts` remain unchanged unless intentionally versioned.

## Server / Client Boundaries

### Server boundary (must stay server-side)
- `app/page.tsx`: route entry, dynamic mode, metadata generation, data fetch, update pinning, page JSON-LD
- `app/layout.tsx`: root metadata, organization JSON-LD, optional analytics and `CoffeePopup`
- `lib/api.ts`: upstream fetches + normalization + 60s in-memory cache

### Client boundary
- `app/BitpandaStatusClient.tsx`: client shell
- `components/status/*`: interactive status UI sections
- `features/status/hooks/useStatusUrlState.ts`: URL/query synchronization
- `features/status/hooks/useStatusData.ts`: client-side filtering/grouping/derived views
- `features/status/types.ts`: filter contracts/options

## Server-to-Client Handoff

1. Server route (`app/page.tsx`) fetches `getAssetData()`.
2. Server applies `applyUpdatePinning(...)`.
3. Server passes `{ data, searchParams }` to `BitpandaStatusClient`.
4. Client handles interaction/state only.

Shared handoff types live in `lib/contracts.ts` (`StatusPageData`, `UpdateLogWithPin`, `SearchParamsRecord`).

## Update Pinning Contract (Server)

`applyUpdatePinning(...)` behavior to preserve:

- Deterministic keying (`update_id` preferred, fallback key otherwise)
- Status-token based maintenance and incident selection
- Maintenance grouping by description link when available, otherwise by component
- Pin latest:
  - `scheduled` (except stale scheduled windows)
  - `in_progress` / `in progress`
  - per-component `investigating` / `monitoring`
- Return order: pinned first (`isPinned: true`), then non-pinned (`isPinned: false`)

## Crawlability Checklist

Must remain present in initial HTML:

- Main heading and supporting text
- Update and asset section headings/table headers
- Links to official status page/external references
- Both JSON-LD scripts (layout + page)

## Validation

Run after architecture-affecting changes:

```bash
npm run verify
```

Quick runtime checks:

1. `npm run build`
2. Route table still includes `ƒ /` (dynamic SSR)
3. View-source contains headings + JSON-LD before hydration
