import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { POST } from "../app/api/process/route";

/**
 * Regression for Sentry issue 119091690 (JAVASCRIPT-NEXTJS-Q): TIFF had been allowed by the file
 * picker and product copy but rejected in assertSupportedMimeType before Sharp ran.
 */
describe("POST /api/process — Sentry 119091690", () => {
  it("accepts image/tiff and returns processed WebP", async () => {
    const tiffBuffer = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .tiff()
      .toBuffer();

    const file = new File([new Uint8Array(tiffBuffer)], "sample.tiff", { type: "image/tiff" });
    const formData = new FormData();
    formData.append("image", file);

    const request = new Request("http://localhost/api/process", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      processed: { mimetype: string; format: string | null };
    };
    expect(body.processed.mimetype).toBe("image/webp");
    expect(body.processed.format).toBe("webp");
  });
});
