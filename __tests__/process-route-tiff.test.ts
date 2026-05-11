import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { POST } from "../app/api/process/route";

describe("POST /api/process", () => {
  /**
   * Sentry issue 119123927 (JAVASCRIPT-NEXTJS-S): production threw
   * "Unsupported file type: image/tiff" even though the upload page allows TIFF via `ACCEPTED_UPLOAD_TYPES`.
   */
  it("Sentry 119123927: accepts image/tiff uploads allowed by the file input", async () => {
    const tiffBuffer = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .tiff()
      .toBuffer();

    const file = new File([new Uint8Array(tiffBuffer)], "probe.tiff", { type: "image/tiff" });
    const formData = new FormData();
    formData.set("image", file);

    const request = new Request("http://localhost/api/process", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      original: { mimetype: string };
      processed: { mimetype: string };
    };
    expect(body.original.mimetype).toBe("image/tiff");
    expect(body.processed.mimetype).toBe("image/webp");
  });
});
