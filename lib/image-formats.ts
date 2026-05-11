/**
 * MIME types the API can process (Sharp path).
 * `ACCEPTED_UPLOAD_TYPES` may include extra picker-only types (e.g. HEIC/HEIF) that the route rejects by design.
 */
export const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/tiff"] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

/** Values for <input accept="..."> — superset of SUPPORTED_MIME_TYPES (incl. HEIC + extensions). */
export const ACCEPTED_UPLOAD_TYPES = [
  ...SUPPORTED_MIME_TYPES,
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
