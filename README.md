# asset-processor

Next.js 14 image-processing demo for showcasing Sentry automated error triage.

Upload a JPEG, PNG, WebP, or TIFF image to resize it with Sharp, convert it to WebP, and inspect the returned metadata. HEIC/HEIF can be chosen in the file picker but are not processed by Sharp in this demo: the API throws before processing so the exception is surfaced to Sentry with upload context attached.

## Sentry demo scenario

1. Start the app locally.
2. Open the upload page.
3. Drop or select a `.heic` or `.heif` file.
4. Click **Process Image**.
5. The request throws `Unsupported file type...` from `app/api/process/route.ts`, allowing Sentry to capture the error and the `upload` context.

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
