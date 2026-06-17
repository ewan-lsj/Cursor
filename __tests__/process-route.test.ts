import { describe, expect, it } from "vitest";

import { POST } from "../app/api/process/route";

function buildUploadRequest(file: File): Request {
  const formData = new FormData();
  formData.append("image", file);

  return new Request("http://localhost/api/process", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/process", () => {
  it("returns 400 when the image field is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/process", {
        method: "POST",
        body: new FormData(),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      message: "Upload an image file in the image field.",
    });
    expect(response.status).toBe(400);
  });

  it("returns 415 instead of throwing for unsupported upload types", async () => {
    const response = await POST(
      buildUploadRequest(new File(["placeholder"], "sample.heic", { type: "image/heic" })),
    );

    await expect(response.json()).resolves.toEqual({
      message: "Unsupported file type: image/heic. Supported file types are JPEG, PNG, WebP, and TIFF.",
    });
    expect(response.status).toBe(415);
  });
});
