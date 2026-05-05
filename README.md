# asset-processor

Next.js 14 image-processing demo for showcasing Sentry automated error triage.

Upload a JPEG, PNG, or WebP image to resize it with Sharp, convert it to WebP, and inspect the returned metadata. Uploading a TIFF or HEIC is intentionally unsupported: the API throws before processing so the exception is surfaced to Sentry with upload context attached.

## Sentry demo scenario

1. Start the app locally.
2. Open the upload page.
3. Drop or select a `.tiff`, `.tif`, `.heic`, or `.heif` file.
4. Click **Process Image**.
5. The request throws `Unsupported file type...` from `app/api/process/route.ts`, allowing Sentry to capture the error and the `upload` context.

## Run locally

```bash
npm install
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and set the Sentry DSN values for your project before running the demo.
