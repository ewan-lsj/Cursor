/**
 * MIME types the API can process (Sharp path).
 * `ACCEPTED_UPLOAD_TYPES` may include extra picker-only types (e.g. TIFF) that the route rejects by design.
 */

/** Maximum upload size for `/api/process` (bytes). */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** User-facing copy for oversized uploads (API 4xx body and client pre-submit checks). */
export const UPLOAD_FILE_TOO_LARGE_MESSAGE =
  "This file is too large. The maximum upload size is 8 MB.";

export const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

/** Values for <input accept="..."> — superset of SUPPORTED_MIME_TYPES (incl. TIFF/HEIC + extensions). */
export const ACCEPTED_UPLOAD_TYPES = [
  ...SUPPORTED_MIME_TYPES,
  "image/tiff",
  "image/heic",
  "image/heif",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
] as const;
