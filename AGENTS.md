# AGENTS.md

## Cursor Cloud specific instructions

This is a single-service Next.js 14 image-processing demo app. No external databases, Docker, or background services are required.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Next.js dev server | `npm run dev` | 3000 | Serves both frontend and API routes |

### Key commands

All standard commands are in `package.json`:

- **Dev server**: `npm run dev`
- **Lint**: `npm run lint`
- **Type check**: `npm run typecheck`
- **Build**: `npm run build`

### Environment variables

Copy `.env.example` to `.env.local`. All vars are Sentry-related and **optional** for local development — the app runs fully without them (errors just won't be reported to Sentry).

### Gotchas

- The app intentionally throws errors for TIFF/HEIC uploads — this is by design for the Sentry demo, not a bug.
- Sharp (native image library) is bundled via npm; no system-level image libraries need to be installed separately.
- Node.js 20+ is required (the environment uses nodesource Node 20 LTS).
