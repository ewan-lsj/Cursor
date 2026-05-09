import { describe, expect, it } from "vitest";

import { ACCEPTED_UPLOAD_TYPES, SUPPORTED_MIME_TYPES } from "../lib/image-formats";

describe("SUPPORTED_MIME_TYPES", () => {
  it("contains JPEG, PNG, WebP, and TIFF MIME types", () => {
    expect(SUPPORTED_MIME_TYPES).toHaveLength(4);
    expect(new Set(SUPPORTED_MIME_TYPES)).toEqual(
      new Set(["image/jpeg", "image/png", "image/webp", "image/tiff"] as const)
    );
  });
});

/** Regression for Sentry numeric issue id 118711794 (JAVASCRIPT-NEXTJS-C): TIFF uploads must not fail MIME validation before Sharp. */
describe("Regression (Sentry 118711794)", () => {
  it("includes image/tiff so POST /api/process accepts TIFF uploads", () => {
    expect(SUPPORTED_MIME_TYPES).toContain("image/tiff");
  });
});

describe("ACCEPTED_UPLOAD_TYPES", () => {
  it("includes MIME types accepted in the file input but not processed by the API", () => {
    for (const mime of ["image/heic", "image/heif"] as const) {
      expect(ACCEPTED_UPLOAD_TYPES).toContain(mime);
      expect(SUPPORTED_MIME_TYPES).not.toContain(mime);
    }
    expect(ACCEPTED_UPLOAD_TYPES).toContain("image/tiff");
    expect(SUPPORTED_MIME_TYPES).toContain("image/tiff");
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
