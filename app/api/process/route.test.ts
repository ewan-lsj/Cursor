import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { POST } from "./route";

function buildRequest(file: File): Request {
  const form = new FormData();
  form.append("image", file);
  return new Request("http://localhost/api/process", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/process — Sentry JAVASCRIPT-NEXTJS-3 regression", () => {
  it("returns 400 (not a thrown 500) when the uploaded file has an unsupported MIME type", async () => {
    const tiff = new File([new Uint8Array([0x49, 0x49, 0x2a, 0x00])], "sample.tiff", {
      type: "image/tiff",
    });

    const response = await POST(buildRequest(tiff));

    assert.equal(
      response.status,
      400,
      "Unsupported MIME types should be rejected with a 400 Bad Request, not bubble up as an unhandled exception (see Sentry issue JAVASCRIPT-NEXTJS-3).",
    );

    const body = (await response.json()) as { message?: string };
    assert.match(
      body.message ?? "",
      /Unsupported file type/i,
      "Response body should explain the validation failure to the client.",
    );
  });

  it("rejects requests with no image field with a 400", async () => {
    const form = new FormData();
    const request = new Request("http://localhost/api/process", {
      method: "POST",
      body: form,
    });

    const response = await POST(request);
    assert.equal(response.status, 400);
  });
});
