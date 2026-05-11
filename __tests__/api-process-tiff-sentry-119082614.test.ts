import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { POST } from "../app/api/process/route";

/**
 * Regression: Sentry issue 119082614 — POST /api/process threw
 * "Unsupported file type: image/tiff" while the UI allowed TIFF uploads.
 */
describe("POST /api/process — Sentry 119082614 (image/tiff)", () => {
  it("accepts a TIFF upload and returns processed WebP metadata", async () => {
    const tiffBytes = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .tiff()
      .toBuffer();

    const formData = new FormData();
    formData.set(
      "image",
      new File([new Uint8Array(tiffBytes)], "regression.tiff", { type: "image/tiff" })
    );

    const response = await POST(new Request("http://test.local/api/process", { method: "POST", body: formData }));

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
