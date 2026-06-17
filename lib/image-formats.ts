/** MIME types the API can process through Sharp. */
export const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/tiff"] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

/** Values for <input accept="...">, including extension tokens for common browser MIME gaps. */
export const ACCEPTED_UPLOAD_TYPES = [
  ...SUPPORTED_MIME_TYPES,
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".tif",
  ".tiff",
] as const;
