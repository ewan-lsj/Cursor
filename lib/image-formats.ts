/** Maximum upload size for a single image (bytes). Shared by API route and client UI. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** User-facing copy when `size` exceeds `MAX_UPLOAD_BYTES` (API JSON and client banner). */
export function uploadFileTooLargeUserMessage(): string {
  const mb = MAX_UPLOAD_BYTES / (1024 * 1024);
  return `That file is larger than ${mb} MB. Choose a smaller image to continue.`;
}

export function isUploadOverMaxBytes(size: number): boolean {
  return size > MAX_UPLOAD_BYTES;
}

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
