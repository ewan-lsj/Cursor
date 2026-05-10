import { describe, expect, it } from "vitest";

import { SUPPORTED_MIME_TYPES } from "../lib/image-formats";

/**
 * Regression: Sentry issue 118899515 (JAVASCRIPT-NEXTJS-J) — POST /api/process
 * threw "Unsupported file type: image/tiff" when the UI and file input allow TIFF.
 */
describe("Sentry 118899515 — TIFF must be a supported processing MIME type", () => {
  it("includes image/tiff in SUPPORTED_MIME_TYPES so the process route accepts TIFF uploads", () => {
    expect(SUPPORTED_MIME_TYPES).toContain("image/tiff");
  });
});
