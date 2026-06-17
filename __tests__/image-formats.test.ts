import { describe, expect, it } from "vitest";

import { ACCEPTED_UPLOAD_TYPES, SUPPORTED_MIME_TYPES } from "../lib/image-formats";

describe("SUPPORTED_MIME_TYPES", () => {
  it("contains exactly the image MIME types processed by the API", () => {
    expect(SUPPORTED_MIME_TYPES).toHaveLength(4);
    expect(new Set(SUPPORTED_MIME_TYPES)).toEqual(
      new Set(["image/jpeg", "image/png", "image/webp", "image/tiff"] as const)
    );
  });
});

describe("ACCEPTED_UPLOAD_TYPES", () => {
  it("includes extension tokens for the file picker", () => {
    for (const ext of [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"] as const) {
      expect(ACCEPTED_UPLOAD_TYPES).toContain(ext);
      expect(SUPPORTED_MIME_TYPES).not.toContain(ext);
    }
  });

  it("includes all supported processing MIME types", () => {
    for (const mime of SUPPORTED_MIME_TYPES) {
      expect(ACCEPTED_UPLOAD_TYPES).toContain(mime);
    }
  });

  it("does not advertise image types the API cannot process", () => {
    for (const type of ["image/heic", "image/heif", ".heic", ".heif"] as const) {
      expect(ACCEPTED_UPLOAD_TYPES).not.toContain(type);
    }
  });
});
