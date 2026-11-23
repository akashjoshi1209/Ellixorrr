import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ERROR_CODES,
  SUCCESS_CODES,
  feedbackPath,
  feedbackQuery,
  getErrorMessage,
  getSuccessMessage,
  isErrorCode,
  isSuccessCode,
  mapAuthError,
} from "@/lib/feedback";
import {
  isAdminPath,
  isAuthPath,
  isCustomerPath,
  localizedPath,
  resolveLocale,
  safeRedirectPath,
  stripLocalePrefix,
  getAppOrigin,
} from "@/lib/navigation";
import {
  adminEnquiryStatusSchema,
  enquirySchema,
  profileSchema,
} from "@/lib/validations";
import { dictionaries } from "@/i18n/dictionaries";
import { locales } from "@/i18n/config";

describe("feedback allowlist", () => {
  it("accepts only declared error codes", () => {
    for (const code of ERROR_CODES) {
      expect(isErrorCode(code)).toBe(true);
    }
    expect(isErrorCode("__proto__")).toBe(false);
    expect(isErrorCode("constructor")).toBe(false);
    expect(isErrorCode("toString")).toBe(false);
    expect(isErrorCode("")).toBe(false);
    expect(isErrorCode("generic_error ")).toBe(false);
    expect(isErrorCode(undefined)).toBe(false);
    expect(isErrorCode(null)).toBe(false);
    expect(isErrorCode(42)).toBe(false);
  });

  it("accepts only declared success codes", () => {
    for (const code of SUCCESS_CODES) {
      expect(isSuccessCode(code)).toBe(true);
    }
    expect(isSuccessCode("submitted")).toBe(false);
    expect(isSuccessCode("__proto__")).toBe(false);
    expect(isSuccessCode(undefined)).toBe(false);
    expect(isSuccessCode(null)).toBe(false);
  });

  it("never renders an unknown code", () => {
    for (const locale of locales) {
      const dict = dictionaries[locale];
      expect(
        getErrorMessage(dict, "<script>alert(1)</script>")
      ).toBeNull();
      expect(getErrorMessage(dict, "unknown_code")).toBeNull();
      expect(getErrorMessage(dict, undefined)).toBeNull();
      expect(getSuccessMessage(dict, "<b>ok</b>")).toBeNull();
      expect(getSuccessMessage(dict, "unknown_code")).toBeNull();
      expect(getSuccessMessage(dict, undefined)).toBeNull();
    }
  });

  it("resolves every declared code to a non-empty localized message", () => {
    for (const locale of locales) {
      const dict = dictionaries[locale];
      for (const code of ERROR_CODES) {
        const message = getErrorMessage(dict, code);
        expect(message, `${locale}:${code}`).toBeTypeOf("string");
        expect((message as string).trim().length, `${locale}:${code}`).toBeGreaterThan(0);
      }
      for (const code of SUCCESS_CODES) {
        const message = getSuccessMessage(dict, code);
        expect(message, `${locale}:${code}`).toBeTypeOf("string");
        expect((message as string).trim().length, `${locale}:${code}`).toBeGreaterThan(0);
      }
    }
  });

  it("builds query strings from codes only", () => {
    expect(feedbackQuery({ error: "invalid_credentials" })).toBe(
      "error=invalid_credentials"
    );
    expect(feedbackQuery({ success: "registered" })).toBe("message=registered");
    expect(feedbackQuery({})).toBe("");
  });

  it("builds a localized, anchored feedback path", () => {
    expect(
      feedbackPath("hi", "/", { success: "enquiry_submitted" }, "contact")
    ).toBe("/hi?message=enquiry_submitted#contact");
    expect(
      feedbackPath("en", "/auth/login", { error: "invalid_credentials" })
    ).toBe("/en/auth/login?error=invalid_credentials");
  });
});

describe("mapAuthError", () => {
  it("never returns the raw error message", () => {
    const raw = "Database connection failed: postgres://user:pass@host/db";
    const mapped = mapAuthError({ message: raw });
    expect(mapped).toBe("generic_error");
    expect(mapped).not.toContain("postgres");
  });

  it("maps known Supabase auth failures onto allowlisted codes", () => {
    expect(
      mapAuthError({ message: "User already registered" })
    ).toBe("email_already_exists");
    expect(
      mapAuthError({ message: "Email not confirmed" })
    ).toBe("email_not_confirmed");
    expect(
      mapAuthError({ message: "Password should be at least 6 characters" })
    ).toBe("weak_password");
    expect(
      mapAuthError({ message: "Too many requests", status: 429 })
    ).toBe("rate_limited");
    expect(
      mapAuthError({ message: "Unable to validate email address" })
    ).toBe("invalid_email");
    expect(mapAuthError({ message: "Invalid login credentials" })).toBe(
      "generic_error"
    );
  });

  it("always returns a declared code", () => {
    const samples = [
      null,
      undefined,
      {},
      { message: null },
      { message: "" },
      { message: "boom" },
      { code: "unexpected_code", message: "boom" },
    ];
    for (const sample of samples) {
      const mapped = mapAuthError(sample);
      expect(ERROR_CODES).toContain(mapped);
    }
  });
});

describe("safeRedirectPath", () => {
  it("accepts locale-prefixed application paths", () => {
    expect(safeRedirectPath("/en/dashboard")).toBe("/en/dashboard");
    expect(safeRedirectPath("/en")).toBe("/en");
    expect(safeRedirectPath("/hi/dashboard/projects")).toBe(
      "/hi/dashboard/projects"
    );
    expect(safeRedirectPath("/mr/admin/customers")).toBe("/mr/admin/customers");
  });

  it("rejects off-site and protocol-relative targets", () => {
    expect(safeRedirectPath("https://evil.example/en")).toBeNull();
    expect(safeRedirectPath("http://evil.example/en")).toBeNull();
    expect(safeRedirectPath("//evil.example/en")).toBeNull();
    expect(safeRedirectPath("javascript:alert(1)")).toBeNull();
    expect(safeRedirectPath("data:text/html,<script>")).toBeNull();
  });

  it("rejects paths that are not locale-prefixed", () => {
    expect(safeRedirectPath("/dashboard")).toBeNull();
    expect(safeRedirectPath("/xx/dashboard")).toBeNull();
    expect(safeRedirectPath("dashboard")).toBeNull();
    expect(safeRedirectPath("en/dashboard")).toBeNull();
  });

  it("rejects traversal segments", () => {
    expect(safeRedirectPath("/en/../admin")).toBeNull();
    expect(safeRedirectPath("/en/./admin")).toBeNull();
    expect(safeRedirectPath("/en/dashboard/../../admin")).toBeNull();
    expect(safeRedirectPath("/en/%2e%2e/admin")).toBeNull();
  });

  it("rejects authentication paths so a redirect can never loop", () => {
    expect(safeRedirectPath("/en/auth/login")).toBeNull();
    expect(safeRedirectPath("/en/auth/register")).toBeNull();
    expect(safeRedirectPath("/en/auth/forgot-password")).toBeNull();
    expect(safeRedirectPath("/en/auth/reset-password")).toBeNull();
  });

  it("rejects query strings, fragments and malformed characters", () => {
    expect(safeRedirectPath("/en/dashboard?next=/admin")).toBeNull();
    expect(safeRedirectPath("/en/dashboard#section")).toBeNull();
    expect(safeRedirectPath("/en/dashboard with space")).toBeNull();
    expect(safeRedirectPath("/en\\dashboard")).toBeNull();
    expect(safeRedirectPath("/en/dashboard\n")).toBeNull();
    expect(safeRedirectPath("/en/dashboard//projects")).toBeNull();
  });

  it("rejects empty, non-string and oversized values", () => {
    expect(safeRedirectPath("")).toBeNull();
    expect(safeRedirectPath(undefined)).toBeNull();
    expect(safeRedirectPath(null)).toBeNull();
    expect(safeRedirectPath(42)).toBeNull();
    expect(safeRedirectPath({})).toBeNull();
    expect(safeRedirectPath(`/en/${"a".repeat(600)}`)).toBeNull();
  });
});

describe("navigation helpers", () => {
  it("resolves unknown locales to the default locale", () => {
    expect(resolveLocale("hi")).toBe("hi");
    expect(resolveLocale("mr")).toBe("mr");
    expect(resolveLocale("xx")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
    expect(resolveLocale(null)).toBe("en");
  });

  it("builds locale-prefixed paths", () => {
    expect(localizedPath("en", "/dashboard")).toBe("/en/dashboard");
    expect(localizedPath("hi", "/")).toBe("/hi");
    expect(localizedPath("mr", "dashboard")).toBe("/mr/dashboard");
  });

  it("strips the locale prefix", () => {
    expect(stripLocalePrefix("/en/dashboard")).toBe("/dashboard");
    expect(stripLocalePrefix("/en")).toBe("/");
    expect(stripLocalePrefix("/dashboard")).toBe("/dashboard");
  });

  it("classifies protected paths", () => {
    expect(isAuthPath("/auth/login")).toBe(true);
    expect(isAuthPath("/auth")).toBe(true);
    expect(isAuthPath("/dashboard")).toBe(false);
    expect(isCustomerPath("/dashboard")).toBe(true);
    expect(isCustomerPath("/dashboard/projects")).toBe(true);
    expect(isCustomerPath("/admin")).toBe(false);
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/enquiries")).toBe(true);
    expect(isAdminPath("/dashboard")).toBe(false);
  });
});

describe("app origin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns NEXT_PUBLIC_APP_URL when set (trailing slash stripped)", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ellixorrr.dpdns.org/");
    expect(getAppOrigin()).toBe("https://ellixorrr.dpdns.org");
  });

  it("falls back to localhost in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getAppOrigin()).toBe("http://localhost:3000");
  });

  it("falls back to the production domain in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getAppOrigin()).toBe("https://ellixorrr.dpdns.org");
  });

  it("never falls back to NEXT_PUBLIC_SUPABASE_URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    expect(getAppOrigin()).toBe("https://ellixorrr.dpdns.org");
    expect(getAppOrigin()).not.toContain("supabase.co");
  });
});

describe("profile validation", () => {
  it("does not accept business_name on the profile form", () => {
    const result = profileSchema.safeParse({
      full_name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+919404044607",
      business_name: "Acme",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("business_name");
      expect(Object.keys(result.data).sort()).toEqual([
        "email",
        "full_name",
        "phone",
      ]);
    }
  });

  it("rejects an invalid profile email", () => {
    const result = profileSchema.safeParse({
      full_name: "Ada",
      email: "not-an-email",
      phone: "",
    });
    expect(result.success).toBe(false);
  });

  it("still accepts business_name on the enquiry form", () => {
    const result = enquirySchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+919404044607",
      business_name: "Acme",
      service_type: "Websites",
      project_description: "A marketing website.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.business_name).toBe("Acme");
    }
  });
});

describe("admin enquiry status validation", () => {
  it("accepts only the declared statuses", () => {
    const valid = adminEnquiryStatusSchema.safeParse({
      enquiry_id: "3f333df6-90a4-4fda-8dd3-9485d27cee36",
      status: "reviewing",
    });
    expect(valid.success).toBe(true);

    const invalid = adminEnquiryStatusSchema.safeParse({
      enquiry_id: "3f333df6-90a4-4fda-8dd3-9485d27cee36",
      status: "deleted",
    });
    expect(invalid.success).toBe(false);
  });

  it("rejects a non-UUID enquiry id", () => {
    const result = adminEnquiryStatusSchema.safeParse({
      enquiry_id: "not-a-uuid",
      status: "new",
    });
    expect(result.success).toBe(false);
  });
});

describe("locale feedback parity", () => {
  it("every locale defines exactly the allowlisted feedback keys", () => {
    for (const locale of locales) {
      const dict = dictionaries[locale];
      expect(
        Object.keys(dict.feedback.errors).sort(),
        `${locale} error keys`
      ).toEqual([...ERROR_CODES].sort());
      expect(
        Object.keys(dict.feedback.success).sort(),
        `${locale} success keys`
      ).toEqual([...SUCCESS_CODES].sort());
    }
  });
});
