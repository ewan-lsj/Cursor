/**
 * MIME types the API can process (Sharp path).
 * Keep in sync with client UX: see ACCEPTED_UPLOAD_TYPES for file-picker-only types.
 */
export const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

/**
 * Hard cap on uploaded image size, enforced by the API and surfaced in the UI.
 * Sharp can technically handle larger payloads, but anything beyond this is
 * almost always a misuse of the demo and risks tying up the route handler.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Human-friendly rendering of {@link MAX_UPLOAD_BYTES} for error messages and UI hints. */
export const MAX_UPLOAD_LABEL = "10 MB";

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
