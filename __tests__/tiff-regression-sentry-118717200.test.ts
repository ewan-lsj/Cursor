import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { SUPPORTED_MIME_TYPES } from "../lib/image-formats";

/**
 * Regression test for Sentry issue 118717200 (JAVASCRIPT-NEXTJS-D):
 * POST /api/process rejected `image/tiff` with an thrown Error while the file
 * input allowed TIFF via ACCEPTED_UPLOAD_TYPES, producing unhandled errors in Sentry.
 */
describe("TIFF support (Sentry 118717200)", () => {
  it("includes image/tiff in SUPPORTED_MIME_TYPES and Sharp can resize TIFF to WebP", async () => {
    expect(SUPPORTED_MIME_TYPES).toContain("image/tiff");

    const inputBuffer = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .tiff()
      .toBuffer();

    const out = await sharp(inputBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    expect(out.byteLength).toBeGreaterThan(0);
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("webp");
  });
});
