# Contributing

Thanks for contributing to **Bitpanda Status — Community Edition**.
This is a community-maintained project (not affiliated with Bitpanda), and helpful improvements are welcome.

## Quick Start
1. Fork the repository and create a branch from `main`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the env file and adjust values if needed:
   ```bash
   cp .env.example .env.local
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

App runs at `http://localhost:3002`.

## Project Conventions (Important)
This app has strict SSR/SEO boundaries.
See `README.md` for the current architecture map.

### Keep Server Responsibilities on the Server
- `app/page.tsx` must remain server-rendered with:
  - `export const dynamic = 'force-dynamic'`
  - `generateMetadata()`
  - server `getAssetData()` call
  - server-side `applyUpdatePinning(...)`
- `app/layout.tsx` must keep root metadata and organization JSON-LD.

### Keep Client Responsibilities in Client Modules
- Interactive state stays in:
  - `app/BitpandaStatusClient.tsx`
  - `components/status/*`
  - `features/status/hooks/*`

### Do Not Change URL Query Parameter Keys
These query parameters are contractually stable:
- `search`, `maintenance`, `tradeOnly`, `fullyIntegrated`, `stakeable`, `newAssets`, `fusion`, `limitOrder`, `margin`

## Configuration
Main environment variables:

```bash
STATUS_API_BASE_URL=https://bitpandastatus.info

BITPANDA_NEW_ASSETS_URL=https://api.bitpanda.com/v1/prices/assets/new

# Optional analytics
NEXT_PUBLIC_PLAUSIBLE_ENABLED=false
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
NEXT_PUBLIC_PLAUSIBLE_SRC=https://plausible.io/js/script.js

# Optional donation popup toggle
NEXT_PUBLIC_COFFEE_ENABLED=false

# Brand and Social (Generic defaults)
NEXT_PUBLIC_BASE_URL=https://your-site.com
NEXT_PUBLIC_SITE_NAME=Bitpanda Status - Community Edition
NEXT_PUBLIC_SOCIAL_X_URL=https://x.com/your-handle
NEXT_PUBLIC_SOCIAL_X_HANDLE=@your-handle
NEXT_PUBLIC_CRYPTO_ADDRESS=your-crypto-address
NEXT_PUBLIC_COFFEE_URL=https://coff.ee/your-handle
```

## Before Opening a PR
Run the full verification pipeline:

```bash
npm run verify
```

This runs:
- `npm run lint`
- `npm run build

## Documentation to Check When Refactoring
- `docs/architecture-guardrails.md`

## PR Guidelines
- Keep PRs focused and clearly describe the change.
- Include screenshots/GIFs for UI changes.
- Update docs (`README.md`, `AGENTS.md`, etc.) when behavior or structure changes.
- Preserve accessibility and responsive behavior.

## Reporting Issues
Open an issue with:
- expected behavior
- actual behavior
- reproduction steps
- environment details (browser, OS, local/prod)

## License
By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
