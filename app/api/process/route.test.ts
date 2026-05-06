import { describe, expect, it } from "vitest";

import { POST } from "./route";

function buildFormDataRequest(file: File): Request {
  const formData = new FormData();
  formData.append("image", file);

  return new Request("http://localhost/api/process", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/process", () => {
  it("regression: Sentry JAVASCRIPT-NEXTJS-2 — returns 400 (not an unhandled 500) when the upload is an unsupported MIME type like image/tiff", async () => {
    const tiffFile = new File([new Uint8Array([0x49, 0x49, 0x2a, 0x00])], "file_example_TIFF_1MB.tiff", {
      type: "image/tiff",
    });

    const response = await POST(buildFormDataRequest(tiffFile));

    expect(response.status).toBe(400);

    const payload = (await response.json()) as { message?: unknown };
    expect(typeof payload.message).toBe("string");
    expect(payload.message).toMatch(/image\/tiff/);
    expect(payload.message).toMatch(/JPEG, PNG, and WebP/);
  });

  it("returns 400 when no image field is provided", async () => {
    const formData = new FormData();
    const request = new Request("http://localhost/api/process", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
