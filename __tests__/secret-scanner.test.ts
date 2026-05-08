import { describe, expect, it } from "vitest";

// The hook is shipped as plain Node ESM so it can be invoked directly by the
// Cursor agent runtime without a TypeScript build step. The test imports it
// dynamically so vitest resolves it through Node's ESM loader.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const importPatterns = (): Promise<any> =>
  import("../.cursor/hooks/secret-patterns.mjs" as string);

describe("secret-patterns: scan", () => {
  it("returns no findings for an empty input", async () => {
    const { scan } = await importPatterns();
    expect(scan("")).toEqual([]);
    expect(scan(undefined as unknown as string)).toEqual([]);
  });

  it("flags an AWS access key id", async () => {
    const { scan } = await importPatterns();
    // Constructed from parts so this source file does not itself contain a
    // string that matches the AWS access-key format.
    const fakeAwsKey = "AKIA" + "IOSFODNN7" + "EXAMPLE";
    const findings = scan(`Hi please use ${fakeAwsKey} for the deploy.`);
    expect(findings).toHaveLength(1);
    expect(findings[0].id).toBe("aws_access_key_id");
    expect(findings[0].preview).toMatch(/^AKIA…/);
  });

  it("flags a GitHub fine-grained PAT", async () => {
    const { scan } = await importPatterns();
    const token = `github_pat_${"A".repeat(82)}`;
    const findings = scan(`token=${token}`);
    expect(findings.map((f: { id: string }) => f.id)).toContain("github_fine_grained_pat");
  });

  it("flags a Sentry DSN", async () => {
    const { scan } = await importPatterns();
    const dsn = `https://${"a".repeat(32)}@o12345.${"ingest"}.us.sentry.io/4509999`;
    expect(scan(dsn).some((f: { id: string }) => f.id === "sentry_dsn")).toBe(true);
  });

  it("flags a Stripe live secret key", async () => {
    const { scan } = await importPatterns();
    const key = `sk_live_${"a".repeat(40)}`;
    expect(scan(key).some((f: { id: string }) => f.id === "stripe_secret_key")).toBe(true);
  });

  it("flags a Slack bot token", async () => {
    const { scan } = await importPatterns();
    // Assembled from parts so this source file does not itself look like a
    // real Slack token to GitHub push-protection / other secret scanners.
    const token = ["xox" + "b", "1234567890", "1234567890", "abcdefghij" + "KLMNOPqrstuvwx"].join("-");
    expect(scan(token).some((f: { id: string }) => f.id === "slack_token")).toBe(true);
  });

  it("flags an OpenAI key with a sk-proj- prefix", async () => {
    const { scan } = await importPatterns();
    const key = `sk-proj-${"a".repeat(60)}`;
    expect(scan(key).some((f: { id: string }) => f.id === "openai_api_key")).toBe(true);
  });

  it("flags an Anthropic key", async () => {
    const { scan } = await importPatterns();
    const key = `sk-ant-api03-${"a".repeat(80)}`;
    expect(scan(key).some((f: { id: string }) => f.id === "anthropic_api_key")).toBe(true);
  });

  it("flags a PEM private-key header", async () => {
    const { scan } = await importPatterns();
    const pem = "-----BEGIN RSA PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9...";
    expect(scan(pem).some((f: { id: string }) => f.id === "pem_private_key")).toBe(true);
  });

  it("flags a JWT", async () => {
    const { scan } = await importPatterns();
    // Built from parts; no literal RFC-7519 token string lives in this file.
    const header = "eyJ" + "hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    const payload = "eyJ" + "zdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QifQ";
    const signature = "Z".repeat(40);
    const jwt = `${header}.${payload}.${signature}`;
    expect(scan(jwt).some((f: { id: string }) => f.id === "jwt")).toBe(true);
  });

  it("redacts secrets in the preview field", async () => {
    const { scan } = await importPatterns();
    const findings = scan(`ghp_${"A".repeat(36)}`);
    expect(findings[0].preview).not.toContain("AAAAAAAA");
    expect(findings[0].preview).toMatch(/…/);
  });

  it("produces a stable fingerprint for the same secret", async () => {
    const { scan, fingerprint } = await importPatterns();
    const key = `ghp_${"A".repeat(36)}`;
    const [first] = scan(key);
    const [second] = scan(`prefix ${key} suffix`);
    expect(first.fingerprint).toBe(second.fingerprint);
    expect(first.fingerprint).toBe(fingerprint(key));
    expect(first.fingerprint).toMatch(/^[0-9a-f]{8}$/);
  });

  it("does not flag obviously safe text", async () => {
    const { scan } = await importPatterns();
    expect(
      scan("Please refactor app/api/process/route.ts so it returns 415 for unsupported types."),
    ).toEqual([]);
  });
});

describe("secret-patterns: scanPayload", () => {
  it("walks attachments and deduplicates findings by fingerprint", async () => {
    const { scanPayload } = await importPatterns();
    const dup = `ghp_${"B".repeat(36)}`;
    const findings = scanPayload({
      prompt: `here is one: ${dup}`,
      attachments: [
        { content: `same secret: ${dup}` },
        { nested: { deeper: dup } },
      ],
    });
    expect(findings.filter((f: { id: string }) => f.id === "github_personal_access_token")).toHaveLength(1);
  });

  it("handles missing or malformed attachments without throwing", async () => {
    const { scanPayload } = await importPatterns();
    expect(() => scanPayload({ prompt: "hello" })).not.toThrow();
    expect(() => scanPayload({ prompt: "hello", attachments: null })).not.toThrow();
    expect(() => scanPayload({ prompt: "hello", attachments: 42 })).not.toThrow();
    expect(scanPayload({ prompt: "hello" })).toEqual([]);
  });

  // Critical regression test: the demo-1 Sentry-triggered cloud-agent prompt
  // must always pass cleanly. If a new pattern starts matching this fixture,
  // demo 1 will silently break in production, so this test is the load-bearing
  // contract between the two demos.
  it("allows the demo-1 Sentry remediation prompt", async () => {
    const { scanPayload } = await importPatterns();
    const sentryRemediationPrompt = [
      "A new Sentry issue has been triggered for project javascript-nextjs in",
      "ewan-demo. Please investigate and fix the root cause.",
      "",
      "Issue title: Unsupported file type: image/tiff. Only JPEG, PNG, and WebP are supported.",
      "Issue URL: https://ewan-demo.sentry.io/issues/123456789/",
      "Environment: production",
      "Release: asset-processor@0.1.0",
      "",
      "Stack trace:",
      "  at assertSupportedMimeType (app/api/process/route.ts:43:11)",
      "  at POST (app/api/process/route.ts:85:3)",
      "",
      "Upload context (Sentry.setContext):",
      '  { "filename": "vacation.tiff", "mimetype": "image/tiff", "size": 482133 }',
      "",
      "Repo guardrails:",
      " - Validate inputs at trust boundaries (.cursor/rules/next-api-observability.mdc).",
      " - Do not attach raw file buffers to Sentry context.",
      " - Return structured 4xx for expected user errors.",
    ].join("\n");

    expect(scanPayload({ prompt: sentryRemediationPrompt, attachments: [] })).toEqual([]);
  });
});
