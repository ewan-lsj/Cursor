import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { POST } from "../app/api/process/route";

/**
 * Regression for Sentry issue 118881426 (JAVASCRIPT-NEXTJS-G): TIFF uploads
 * must not throw from assertSupportedMimeType; Sharp should accept image/tiff
 * and return WebP output.
 */
describe("POST /api/process (TIFF)", () => {
  it("Sentry 118881426: accepts image/tiff and returns processed WebP metadata", async () => {
    const tiffBytes = await sharp({
      create: {
        width: 16,
        height: 12,
        channels: 3,
        background: { r: 10, g: 120, b: 200 },
      },
    })
      .tiff()
      .toBuffer();

    const file = new File([new Uint8Array(tiffBytes)], "regression.tif", { type: "image/tiff" });
    const formData = new FormData();
    formData.append("image", file);

    const request = new Request("http://localhost/api/process", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      original: { mimetype: string; format: string | null };
      processed: { mimetype: string; format: string | null; base64: string };
    };

    expect(body.original.mimetype).toBe("image/tiff");
    expect(body.processed.mimetype).toBe("image/webp");
    expect(body.processed.format).toBe("webp");
    expect(body.processed.base64.length).toBeGreaterThan(0);
  });
});
