import { describe, expect, it } from "vitest";
import { validateSupabasePublicEnv } from "../src/lib/supabase/env";

describe("Supabase public environment validation", () => {
  it("accepts an https URL and a non-empty publishable key", () => {
    expect(
      validateSupabasePublicEnv(
        "https://example.supabase.co",
        "sb_publishable_example"
      )
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    });
  });

  it("trims surrounding whitespace without changing the values", () => {
    expect(
      validateSupabasePublicEnv(
        "  https://example.supabase.co  ",
        "  sb_publishable_example  "
      )
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    });
  });

  it.each([
    ["missing URL", undefined, "sb_publishable_example"],
    ["blank URL", "   ", "sb_publishable_example"],
    ["missing key", "https://example.supabase.co", undefined],
    ["blank key", "https://example.supabase.co", "   "],
    ["invalid URL", "not-a-url", "sb_publishable_example"],
    ["unsupported protocol", "ftp://example.supabase.co", "sb_publishable_example"],
  ])("rejects %s with a value-free error", (_label, url, key) => {
    expect(() => validateSupabasePublicEnv(url, key)).toThrow(
      "Supabase public environment variables are missing or invalid"
    );
  });

  it("does not echo supplied values in the error", () => {
    const secretLikeValue = "do-not-print-this-value";
    try {
      validateSupabasePublicEnv(secretLikeValue, "sb_publishable_example");
      throw new Error("expected validation to fail");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).not.toContain(secretLikeValue);
      expect(message).not.toContain("example.supabase.co");
    }
  });
});
