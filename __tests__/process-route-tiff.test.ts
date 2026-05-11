/**
 * Regression for Sentry issue ID 119123927 — TIFF uploads must not throw in assertSupportedMimeType.
 * @see https://ewan-demo.sentry.io/issues/119123927/
 */
import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { POST } from "@/app/api/process/route";

describe("POST /api/process — Sentry 119123927 (TIFF)", () => {
  it("accepts image/tiff and returns WebP payload", async () => {
    const tiffBuffer = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: { r: 40, g: 80, b: 120 },
      },
    })
      .tiff()
      .toBuffer();

    const formData = new FormData();
    formData.append(
      "image",
      new File([new Uint8Array(tiffBuffer)], "probe.tiff", { type: "image/tiff" })
    );

    const response = await POST(
      new Request("http://test.local/api/process", { method: "POST", body: formData })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      processed: { mimetype: string; base64: string };
    };
    expect(body.processed.mimetype).toBe("image/webp");
    expect(body.processed.base64.length).toBeGreaterThan(0);
  });
});
