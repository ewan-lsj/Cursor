import { describe, expect, it } from "vitest";

import { SUPPORTED_MIME_TYPES } from "../lib/image-formats";

/**
 * Regression for Sentry issue 119116208: production threw
 * "Unsupported file type: image/tiff" on POST /api/process despite TIFF
 * being offered in the upload picker. The API must treat image/tiff as Sharp-processable.
 */
describe("Sentry issue 119116208 — TIFF must be processable by /api/process", () => {
  it("includes image/tiff in SUPPORTED_MIME_TYPES", () => {
    expect(SUPPORTED_MIME_TYPES).toContain("image/tiff");
  });
});
