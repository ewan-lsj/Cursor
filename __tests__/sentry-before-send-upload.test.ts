import { describe, expect, it } from "vitest";

import { uploadFileTooLargeUserMessage } from "../lib/image-formats";
import { beforeSendDropExpectedUploadLimitIssues } from "../lib/sentry-before-send-upload";

describe("beforeSendDropExpectedUploadLimitIssues", () => {
  it("drops events for the oversize upload user message", () => {
    const msg = uploadFileTooLargeUserMessage();
    const event = {
      exception: { values: [{ value: msg }] },
    };
    expect(beforeSendDropExpectedUploadLimitIssues(event as never, { originalException: new Error(msg) })).toBeNull();
  });

  it("drops common host payload-too-large errors", () => {
    const event = {
      exception: { values: [{ value: "Payload Too Large" }] },
    };
    expect(
      beforeSendDropExpectedUploadLimitIssues(event as never, {
        originalException: new Error("request body is too large"),
      })
    ).toBeNull();
  });

  it("keeps unrelated errors", () => {
    const event = {
      exception: { values: [{ value: "Something broke in sharp" }] },
    };
    const out = beforeSendDropExpectedUploadLimitIssues(event as never, {
      originalException: new Error("Something broke in sharp"),
    });
    expect(out).toEqual(event);
  });
});
