import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import {
  CONTACT,
  mailtoUrl,
  whatsappUrl,
} from "@/lib/site-config";
import {
  buildOrganization,
  buildProfessionalService,
} from "@/lib/structured-data";

function readProjectFile(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("public contact details", () => {
  it.each(locales)("%s displays the configured real channels", (locale) => {
    const contact = dictionaries[locale].contact;
    expect(contact.whatsapp.number).toBe(CONTACT.phoneDisplay);
    expect(contact.email.address).toBe(CONTACT.email);
    expect(contact.phone.number).toBe(CONTACT.phoneDisplay);
    expect(contact.form.phone.placeholder).toBe(CONTACT.phoneDisplay);
  });

  it("uses one source of truth for deep links and structured data", () => {
    const message = "Question about a project";
    const subject = "Project Enquiry";

    expect(whatsappUrl(message)).toBe(
      `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`
    );
    expect(mailtoUrl(subject)).toBe(
      `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`
    );

    for (const locale of locales) {
      const organization = buildOrganization(locale);
      const professional = buildProfessionalService(locale);
      expect(organization.email).toBe(CONTACT.email);
      expect(organization.telephone).toBe(CONTACT.phoneDial);
      expect(professional.email).toBe(CONTACT.email);
      expect(professional.telephone).toBe(CONTACT.phoneDial);
    }
  });

  it("keeps destination literals out of rendered components", () => {
    for (const file of [
      "src/components/sections/ContactCTA.tsx",
      "src/components/sections/SiteFooter.tsx",
      "src/lib/structured-data.ts",
    ]) {
      const source = readProjectFile(file);
      expect(source, file).not.toContain("ellixorrr@gmail.com");
      expect(source, file).not.toContain("919404044607");
    }
  });

  it("publishes only verifiable facts in the AI-readable summary", () => {
    const summary = readProjectFile("public/llms.txt");
    expect(summary).toContain(CONTACT.email);
    expect(summary).toContain(CONTACT.phoneDisplay);
    expect(summary).toContain(`https://wa.me/${CONTACT.whatsappNumber}`);
    expect(summary).toContain(
      "No client list, testimonials, reviews, certifications, registrations, or performance statistics are published."
    );
  });
});
