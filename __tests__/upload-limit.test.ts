import { describe, expect, it } from "vitest";

import { MAX_UPLOAD_BYTES, UPLOAD_FILE_TOO_LARGE_MESSAGE } from "../lib/upload-limit";

describe("upload limit constants", () => {
  it("uses an 8 MiB byte cap", () => {
    expect(MAX_UPLOAD_BYTES).toBe(8 * 1024 * 1024);
  });

  it("keeps a stable oversized message for API, UI, and Sentry filtering", () => {
    expect(UPLOAD_FILE_TOO_LARGE_MESSAGE).toContain("8 MB");
  });
});
