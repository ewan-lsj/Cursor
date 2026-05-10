/** Maximum size for a single uploaded image (8 MB). */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Shared copy for oversize uploads (API 413 and client banner).
 * Keep in sync everywhere; do not throw for this case — return structured JSON.
 */
export const UPLOAD_FILE_TOO_LARGE_MESSAGE =
  "This file is over the 8 MB limit. Choose a smaller image.";

/**
 * MIME types the API can process (Sharp path).
 * `ACCEPTED_UPLOAD_TYPES` may include extra picker-only types (e.g. TIFF) that the route rejects by design.
 */
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
