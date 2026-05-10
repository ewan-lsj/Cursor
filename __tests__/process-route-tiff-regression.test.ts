import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { POST } from "../app/api/process/route";

/**
 * Regression for Sentry issue 118894284 (JAVASCRIPT-NEXTJS-H):
 * `POST /api/process` must not throw for `image/tiff` when the file input and
 * `ACCEPTED_UPLOAD_TYPES` allow TIFF (matches product copy on the home page).
 */
describe("POST /api/process — TIFF (Sentry 118894284)", () => {
  it("returns 200 and WebP output for a valid image/tiff upload", async () => {
    const tiffBuffer = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .tiff()
      .toBuffer();

    const file = new File([new Uint8Array(tiffBuffer)], "regression.tiff", { type: "image/tiff" });
    const formData = new FormData();
    formData.append("image", file);

    const request = new Request("http://localhost/api/process", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      processed: { mimetype: string; base64: string };
      original: { mimetype: string };
    };
    expect(json.original.mimetype).toBe("image/tiff");
    expect(json.processed.mimetype).toBe("image/webp");
    expect(json.processed.base64.length).toBeGreaterThan(0);
  });
});
