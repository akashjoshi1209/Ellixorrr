/**
 * Canonical service values accepted by enquiry validation and stored in the
 * database. Labels are localized in `src/i18n/locales`; these values are not
 * translated because changing them would invalidate existing enquiries.
 */
export const SERVICE_TYPES = [
  "Websites",
  "Applications",
  "Automations",
  "Custom Solutions",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export function isServiceType(value: string): value is ServiceType {
  return (SERVICE_TYPES as readonly string[]).includes(value);
}
