import { describe, expect, it } from "vitest";

import { POST } from "../app/api/process/route";

const TINY_RED_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC";

function buildRequest(formData: FormData): Request {
  return new Request("http://localhost/api/process", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/process validation", () => {
  it("returns 400 when the request body is not multipart form data", async () => {
    const request = new Request("http://localhost/api/process", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not multipart",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Request body could not be parsed as multipart form data.",
    });
  });

  it('returns 400 when the "image" field is missing or not a file', async () => {
    const formData = new FormData();
    formData.append("not-image", "value");

    const response = await POST(buildRequest(formData));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'Upload an image file in the "image" field.',
    });
  });

  it("returns 400 when the uploaded file is empty", async () => {
    const formData = new FormData();
    formData.append(
      "image",
      new File([], "empty.jpg", { type: "image/jpeg" }),
    );

    const response = await POST(buildRequest(formData));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Uploaded file is empty.",
    });
  });

  it("returns 413 when the uploaded file exceeds the size limit", async () => {
    const oversizedBytes = new Uint8Array(10 * 1024 * 1024 + 1);
    const formData = new FormData();
    formData.append(
      "image",
      new File([oversizedBytes], "huge.jpg", { type: "image/jpeg" }),
    );

    const response = await POST(buildRequest(formData));

    expect(response.status).toBe(413);
    const body = (await response.json()) as { message: string };
    expect(body.message).toMatch(/too large/i);
  });

  it("returns 415 when the mime type is unsupported", async () => {
    const formData = new FormData();
    formData.append(
      "image",
      new File(["scan-bytes"], "scan.tiff", { type: "image/tiff" }),
    );

    const response = await POST(buildRequest(formData));

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      message:
        "Unsupported file type: image/tiff. Only JPEG, PNG, and WebP are supported.",
    });
  });

  it("returns 415 when the upload has no specific mime type", async () => {
    const formData = new FormData();
    formData.append("image", new File(["data"], "mystery.bin", { type: "" }));

    const response = await POST(buildRequest(formData));

    expect(response.status).toBe(415);
    const body = (await response.json()) as { message: string };
    expect(body.message).toMatch(/^Unsupported file type:/);
  });

  it("returns 400 when bytes cannot be decoded as an image", async () => {
    const formData = new FormData();
    formData.append(
      "image",
      new File(["this is definitely not a JPEG"], "fake.jpg", {
        type: "image/jpeg",
      }),
    );

    const response = await POST(buildRequest(formData));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Could not decode the uploaded file as a valid image.",
    });
  });

  it("returns 200 with processing metadata for a valid PNG", async () => {
    const formData = new FormData();
    const pngBytes = Buffer.from(TINY_RED_PNG_BASE64, "base64");
    formData.append(
      "image",
      new File([pngBytes], "tiny.png", { type: "image/png" }),
    );

    const response = await POST(buildRequest(formData));

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      original: { mimetype: string; width: number };
      processed: { mimetype: string; filename: string; base64: string };
    };
    expect(body.original.mimetype).toBe("image/png");
    expect(body.original.width).toBe(8);
    expect(body.processed.mimetype).toBe("image/webp");
    expect(body.processed.filename).toBe("tiny.webp");
    expect(body.processed.base64.length).toBeGreaterThan(0);
  });
});
