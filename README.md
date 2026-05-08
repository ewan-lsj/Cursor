# asset-processor

Next.js 14 image-processing demo for showcasing Sentry automated error triage.

Upload a JPEG, PNG, or WebP image to resize it with Sharp, convert it to WebP, and inspect the returned metadata. Uploads that are missing, empty, oversized, of an unsupported type, or corrupt return a structured 4xx JSON response without throwing, so the API does not surface client-side mistakes as Sentry errors.

## Sentry demo scenario

`app/api/process/route.ts` attaches a low-PII `upload` context (filename, mimetype, size, processing stage) before invoking Sharp. Bad client uploads are returned as JSON with the appropriate 4xx status; only unexpected server-side failures during processing bubble up for Sentry to capture, and they do so with the same `upload` context attached.

## Run locally

```bash
npm install
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and set the Sentry DSN values for your project before running the demo.

## Sentry on Vercel

The app is configured for the Sentry organization `ewan-demo` and project `javascript-nextjs`. In the linked Vercel project, set these environment variables for Production and Preview deployments:

```bash
NEXT_PUBLIC_SENTRY_DSN=<project client DSN>
SENTRY_DSN=<project client DSN>
SENTRY_ORG=ewan-demo
SENTRY_PROJECT=javascript-nextjs
SENTRY_AUTH_TOKEN=<token with org:read and project:releases>
```

`NEXT_PUBLIC_SENTRY_DSN` enables browser error capture, `SENTRY_DSN` enables server and edge runtime capture, and `SENTRY_AUTH_TOKEN` lets `next build` upload source maps so production stack traces resolve to readable files. The Sentry Vercel integration can provide these variables automatically when it is connected to the same project.
