import { describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  setContext: vi.fn(),
}));

import { POST } from "@/app/api/process/route";

function buildRequest(file: File): Request {
  const formData = new FormData();
  formData.append("image", file);

  return new Request("http://localhost/api/process", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/process — Sentry JAVASCRIPT-NEXTJS-4 regression", () => {
  it("returns a structured 415 response for unsupported MIME types instead of throwing (JAVASCRIPT-NEXTJS-4)", async () => {
    const tiff = new File([new Uint8Array([0x4d, 0x4d, 0x00, 0x2a])], "sample.tiff", {
      type: "image/tiff",
    });

    const response = await POST(buildRequest(tiff));

    expect(response.status).toBe(415);

    const body = (await response.json()) as { message?: unknown };
    expect(typeof body.message).toBe("string");
    expect(body.message).toMatch(/unsupported/i);
  });

  it("still rejects requests missing the image field with 400", async () => {
    const formData = new FormData();
    const request = new Request("http://localhost/api/process", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
