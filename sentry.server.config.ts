import * as Sentry from "@sentry/nextjs";

import { UPLOAD_FILE_TOO_LARGE_MESSAGE } from "./lib/upload-limit";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  ignoreErrors: [UPLOAD_FILE_TOO_LARGE_MESSAGE],
});
