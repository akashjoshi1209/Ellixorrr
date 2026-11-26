/**
 * Portal display helpers.
 *
 * Database values are canonical English tokens; they are deliberately kept
 * stable so existing rows and Zod validation remain valid. This module is the
 * single place where those tokens are translated for customer- and admin-facing
 * surfaces.
 */
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

/** Canonical values stored in the database; never used as visible labels. */
export const PROJECT_STATUSES = [
  "enquiry",
  "planning",
  "in_progress",
  "review",
  "completed",
  "on_hold",
] as const;

export const ENQUIRY_STATUSES = [
  "new",
  "reviewing",
  "contacted",
  "converted",
  "closed",
] as const;

export const CUSTOMER_ROLES = ["customer", "admin"] as const;

type AuthDictionary = Dictionary["auth"];

function projectStatusLabel(dict: AuthDictionary, status: string): string {
  switch (status) {
    case "enquiry":
      return dict.statusEnquiry;
    case "planning":
      return dict.statusPlanning;
    case "in_progress":
      return dict.statusInProgress;
    case "review":
      return dict.statusReview;
    case "completed":
      return dict.statusCompleted;
    case "on_hold":
      return dict.statusOnHold;
    default:
      return dict.unknown;
  }
}

function enquiryStatusLabel(dict: AuthDictionary, status: string): string {
  switch (status) {
    case "new":
      return dict.statusNew;
    case "reviewing":
      return dict.reviewing;
    case "contacted":
      return dict.contacted;
    case "converted":
      return dict.converted;
    case "closed":
      return dict.closed;
    default:
      return dict.unknown;
  }
}

function serviceLabel(dict: AuthDictionary, service: string): string {
  switch (service) {
    case "Websites":
      return dict.serviceWebsites;
    case "Applications":
      return dict.serviceApplications;
    case "Automations":
      return dict.serviceAutomations;
    case "Custom Solutions":
      return dict.serviceCustomSolutions;
    default:
      return dict.unknown;
  }
}

function roleLabel(dict: AuthDictionary, role: string): string {
  if (role === "admin") return dict.adminRole;
  if (role === "customer") return dict.customerRole;
  return dict.unknown;
}

/**
 * Formats a database date or timestamp for the active route locale.
 * Date-only values are pinned to UTC so the calendar day stored in the
 * database is the day the visitor sees, regardless of server timezone.
 */
function formatPortalDate(
  value: string | null | undefined,
  locale: Locale,
  style: "short" | "long" = "short"
): string {
  if (!value) return "—";

  let date: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date = new Date(`${value}T00:00:00Z`);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    month: style === "long" ? "long" : "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export const portalLabels = {
  projectStatus: projectStatusLabel,
  enquiryStatus: enquiryStatusLabel,
  service: serviceLabel,
  role: roleLabel,
  date: formatPortalDate,
};
