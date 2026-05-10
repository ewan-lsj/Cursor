/** Maximum upload size (8 MiB). Shared by API route and client. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * JSON `message` for oversized uploads (413). Used by the client banner and
 * Sentry ignore rules — keep wording stable so filtering stays reliable.
 */
export const UPLOAD_FILE_TOO_LARGE_MESSAGE =
  "That file is too large. Choose an image up to 8 MB.";
