/**
 * Regression for Sentry issue 119070262 (https://ewan-demo.sentry.io/issues/119070262/):
 * `POST /api/process` must accept `image/tiff` because the UI advertises TIFF and Sharp decodes it.
 */
import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";

import { POST } from "@/app/api/process/route";

vi.mock("@sentry/nextjs", () => ({
  setContext: vi.fn(),
}));

async function tinyTiffFile(): Promise<File> {
  const buf = await sharp({
    create: { width: 4, height: 4, channels: 3, background: { r: 200, g: 100, b: 50 } },
  })
    .tiff()
    .toBuffer();
  return new File([new Uint8Array(buf)], "regression.tiff", { type: "image/tiff" });
}

describe("POST /api/process", () => {
  it("accepts image/tiff and returns WebP (Sentry 119070262)", async () => {
    const image = await tinyTiffFile();
    const body = new FormData();
    body.set("image", image);

    const res = await POST(new Request("http://localhost/api/process", { method: "POST", body }));

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      original: { mimetype: string };
      processed: { mimetype: string; base64: string };
    };
    expect(json.original.mimetype).toBe("image/tiff");
    expect(json.processed.mimetype).toBe("image/webp");
    expect(json.processed.base64.length).toBeGreaterThan(0);
  });
});
