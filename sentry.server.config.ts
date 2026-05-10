import * as Sentry from "@sentry/nextjs";

import { beforeSendDropExpectedUploadLimitIssues } from "@/lib/sentry-before-send-upload";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  beforeSend: beforeSendDropExpectedUploadLimitIssues,
});
