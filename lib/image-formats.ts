/**
 * MIME types the API can process (Sharp path).
 * Keep in sync with client UX: see ACCEPTED_UPLOAD_TYPES for file-picker-only types.
 */
export const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/tiff"] as const;

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
