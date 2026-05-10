import type { ErrorEvent, EventHint } from "@sentry/core";

import { uploadFileTooLargeUserMessage } from "./image-formats";

const PAYLOAD_LIMIT_PATTERN =
  /entity too large|payload too large|body exceeded|FUNCTION_PAYLOAD_TOO_LARGE|request body.*too large|max body length/i;

/**
 * Drops Sentry events for expected oversize uploads and host-level body limits
 * (so user mistakes and infra limits are not treated like product bugs).
 */
export function beforeSendDropExpectedUploadLimitIssues(
  event: ErrorEvent,
  hint: EventHint,
): ErrorEvent | null {
  const limitMsg = uploadFileTooLargeUserMessage();
  const original = hint.originalException;

  if (original instanceof Error) {
    if (original.message === limitMsg || PAYLOAD_LIMIT_PATTERN.test(original.message)) {
      return null;
    }
  }

  const firstException = event.exception?.values?.[0];
  const value = firstException?.value;
  if (typeof value === "string") {
    if (value === limitMsg || PAYLOAD_LIMIT_PATTERN.test(value)) {
      return null;
    }
  }

  return event;
}
