import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { SUPPORTED_MIME_TYPES } from "../lib/image-formats";

/**
 * Regression for Sentry issue 119075167 (JAVASCRIPT-NEXTJS-N):
 * production threw "Unsupported file type: image/tiff" on POST /api/process
 * because the MIME allowlist did not match the file input or Sharp capabilities.
 */
describe("Sentry issue 119075167 — TIFF must be a supported process MIME type", () => {
  it("includes image/tiff in SUPPORTED_MIME_TYPES so /api/process accepts TIFF uploads", () => {
    expect(SUPPORTED_MIME_TYPES).toContain("image/tiff");
  });

  it("Sharp can read TIFF bytes (same pipeline as /api/process after MIME check)", async () => {
    const tiffBuffer = await sharp({
      create: { width: 2, height: 2, channels: 3, background: { r: 10, g: 20, b: 30 } },
    })
      .tiff()
      .toBuffer();

    const metadata = await sharp(tiffBuffer).metadata();
    expect(metadata.format).toBe("tiff");
  });
});
