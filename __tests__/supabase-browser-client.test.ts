import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createClient } from "../lib/supabase";

describe("Supabase browser client (Sentry issue 120103122)", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    }

    if (originalKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    }
  });

  /**
   * Regression for Sentry 120103122: preview had no Supabase public env vars;
   * `createBrowserClient` threw an unhandled rejection. The app must not throw
   * when configuration is absent.
   */
  it("does not throw when NEXT_PUBLIC Supabase env vars are unset", () => {
    expect(() => createClient()).not.toThrow();
    expect(createClient()).toBeNull();
  });
});
