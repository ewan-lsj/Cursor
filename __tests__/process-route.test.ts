import { describe, expect, it } from "vitest";

import { POST } from "../app/api/process/route";
import { MAX_UPLOAD_BYTES, UPLOAD_FILE_TOO_LARGE_MESSAGE } from "../lib/image-formats";

describe("POST /api/process validation", () => {
  it("returns 413 with a structured message when the file is over the size limit", async () => {
    const body = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    const file = new File([body], "large.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.set("image", file);

    const request = new Request("http://localhost/api/process", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      message: UPLOAD_FILE_TOO_LARGE_MESSAGE,
    });
  });

  it("returns 400 with a structured message for unsupported MIME types (no throw)", async () => {
    const file = new File([new Uint8Array([0])], "scan.tiff", { type: "image/tiff" });
    const formData = new FormData();
    formData.set("image", file);

    const request = new Request("http://localhost/api/process", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(typeof payload.message).toBe("string");
    expect(payload.message).toContain("Unsupported file type");
  });
});
