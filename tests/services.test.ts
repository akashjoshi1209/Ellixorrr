import { describe, expect, it } from "vitest";
import { isServiceType, SERVICE_TYPES } from "@/lib/services";
import { enquirySchema } from "@/lib/validations";
import { dictionaries } from "@/i18n/dictionaries";
import { locales } from "@/i18n/config";

const validEnquiry = (service_type: string) => ({
  name: "Test User",
  email: "test@example.com",
  phone: "",
  business_name: "",
  service_type,
  project_description: "A valid project description.",
});

describe("canonical service types", () => {
  it("accepts every canonical value and rejects unknown values", () => {
    for (const service of SERVICE_TYPES) {
      expect(isServiceType(service), service).toBe(true);
      expect(enquirySchema.safeParse(validEnquiry(service)).success, service).toBe(true);
    }

    expect(isServiceType("websites")).toBe(false);
    expect(isServiceType("Websites<script>")).toBe(false);
    expect(isServiceType("")).toBe(false);
    expect(enquirySchema.safeParse(validEnquiry("Unknown")).success).toBe(false);
  });

  it("provides one localized service label per canonical value in every locale", () => {
    for (const locale of locales) {
      expect(dictionaries[locale].services.items, locale).toHaveLength(
        SERVICE_TYPES.length,
      );
    }
  });
});
