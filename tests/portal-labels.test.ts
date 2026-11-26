import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import { SERVICE_TYPES } from "@/lib/services";
import {
  ENQUIRY_STATUSES,
  PROJECT_STATUSES,
  portalLabels,
} from "@/lib/portal-labels";

const projectStatusKeys = {
  enquiry: "statusEnquiry",
  planning: "statusPlanning",
  in_progress: "statusInProgress",
  review: "statusReview",
  completed: "statusCompleted",
  on_hold: "statusOnHold",
} as const;

const enquiryStatusKeys = {
  new: "statusNew",
  reviewing: "reviewing",
  contacted: "contacted",
  converted: "converted",
  closed: "closed",
} as const;

const serviceKeys = {
  Websites: "serviceWebsites",
  Applications: "serviceApplications",
  Automations: "serviceAutomations",
  "Custom Solutions": "serviceCustomSolutions",
} as const;

describe("portal display labels", () => {
  it.each(locales)("%s translates every project status", (locale) => {
    const dict = dictionaries[locale].auth;
    for (const status of PROJECT_STATUSES) {
      expect(portalLabels.projectStatus(dict, status)).toBe(
        dict[projectStatusKeys[status]]
      );
    }
    expect(portalLabels.projectStatus(dict, "unexpected")).toBe(dict.unknown);
  });

  it.each(locales)("%s translates every enquiry status", (locale) => {
    const dict = dictionaries[locale].auth;
    for (const status of ENQUIRY_STATUSES) {
      expect(portalLabels.enquiryStatus(dict, status)).toBe(
        dict[enquiryStatusKeys[status]]
      );
    }
    expect(portalLabels.enquiryStatus(dict, "unexpected")).toBe(dict.unknown);
  });

  it.each(locales)("%s translates every service type", (locale) => {
    const dict = dictionaries[locale].auth;
    for (const service of SERVICE_TYPES) {
      expect(portalLabels.service(dict, service)).toBe(
        dict[serviceKeys[service]]
      );
    }
    expect(portalLabels.service(dict, "Unexpected")).toBe(dict.unknown);
  });

  it.each(locales)("%s translates the two supported roles", (locale) => {
    const dict = dictionaries[locale].auth;
    expect(portalLabels.role(dict, "admin")).toBe(dict.adminRole);
    expect(portalLabels.role(dict, "customer")).toBe(dict.customerRole);
    expect(portalLabels.role(dict, "owner")).toBe(dict.unknown);
  });
});

describe("portal date formatting", () => {
  it("formats a date-only value as the stored UTC calendar day", () => {
    expect(portalLabels.date("2026-01-02", "en")).toBe("2 Jan 2026");
    expect(portalLabels.date("2026-01-02", "en", "long")).toBe(
      "2 January 2026"
    );
  });

  it("uses a stable placeholder for missing or invalid values", () => {
    expect(portalLabels.date(null, "en")).toBe("—");
    expect(portalLabels.date("", "en")).toBe("—");
    expect(portalLabels.date("2026-13-40", "en")).toBe("—");
  });
});
