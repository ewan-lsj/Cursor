import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { SUPPORTED_MIME_TYPES } from "../lib/image-formats";

/**
 * Regression: Sentry issue 118916697 — production threw
 * "Unsupported file type: image/tiff" on POST /api/process while the file input
 * allowed TIFF. The allowlist must include image/tiff and Sharp must decode TIFF
 * for the same pipeline as JPEG/PNG/WebP.
 */
describe("Sentry 118916697 — TIFF accepted for processing", () => {
  it("includes image/tiff in SUPPORTED_MIME_TYPES (process route gate)", () => {
    expect(SUPPORTED_MIME_TYPES).toContain("image/tiff");
  });

  it("Sharp decodes TIFF bytes so the /api/process pipeline can run", async () => {
    const tiff = await sharp({
      create: { width: 2, height: 2, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .tiff()
      .toBuffer();

    const meta = await sharp(tiff).metadata();
    expect(meta.format).toBe("tiff");

    const webp = await sharp(tiff).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    expect(webp.byteLength).toBeGreaterThan(0);
    expect((await sharp(webp).metadata()).format).toBe("webp");
  });
});
