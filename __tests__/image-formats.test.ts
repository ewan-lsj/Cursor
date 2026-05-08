import { describe, expect, it } from "vitest";

import {
  ACCEPTED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  SUPPORTED_MIME_TYPES,
} from "../lib/image-formats";

describe("SUPPORTED_MIME_TYPES", () => {
  it("contains exactly JPEG, PNG, and WebP MIME types", () => {
    expect(SUPPORTED_MIME_TYPES).toHaveLength(3);
    expect(new Set(SUPPORTED_MIME_TYPES)).toEqual(
      new Set(["image/jpeg", "image/png", "image/webp"] as const)
    );
  });
});

describe("ACCEPTED_UPLOAD_TYPES", () => {
  it("includes MIME types accepted in the file input but not processed by the API", () => {
    for (const mime of ["image/tiff", "image/heic", "image/heif"] as const) {
      expect(ACCEPTED_UPLOAD_TYPES).toContain(mime);
      expect(SUPPORTED_MIME_TYPES).not.toContain(mime);
    }
  });

  it("includes extension tokens for the file picker", () => {
    for (const ext of [".tif", ".tiff", ".heic", ".heif"] as const) {
      expect(ACCEPTED_UPLOAD_TYPES).toContain(ext);
      expect(SUPPORTED_MIME_TYPES).not.toContain(ext);
    }
  });

  it("includes all supported processing MIME types", () => {
    for (const mime of SUPPORTED_MIME_TYPES) {
      expect(ACCEPTED_UPLOAD_TYPES).toContain(mime);
    }
  });
});

describe("MAX_UPLOAD_BYTES", () => {
  it("caps uploads at exactly 10 MiB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
  });

  it("uses a human-friendly label that matches the byte cap", () => {
    expect(MAX_UPLOAD_LABEL).toBe("10 MB");
  });
});
