"use client";

import { useSearchParams } from "next/navigation";
import { Mail, Phone, Smartphone } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { EyebrowRule } from "@/components/sections/SectionShell";
import { submitEnquiryAction } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

const WHATSAPP_NUMBER = "919404044607";
const EMAIL_ADDRESS = "ellixorrr@gmail.com";
const PHONE_NUMBER = "+919404044607";

type ContactCTAProps = {
  dict: Dictionary;
  locale: Locale;
};

const SERVICES = ["Websites", "Applications", "Automations", "Custom Solutions"];

export function ContactCTA({ dict, locale }: ContactCTAProps) {
  const searchParams = useSearchParams();
  // Only allowlisted codes are rendered — the raw query value is never shown.
  const error = searchParams.get("error") || undefined;
  const message = searchParams.get("message") || undefined;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(dict.contact.whatsapp.message)}`;
  const mailtoUrl = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(dict.contact.email.subject)}`;

  return (
    <section
      id="contact"
      aria-label={dict.contact.eyebrow}
      className="relative overflow-hidden border-t border-bone/[0.06] bg-charcoal"
    >
      <div aria-hidden="true" className="absolute inset-0 forest-glow [--glow-x:20%] [--glow-y:100%]" />
      <div className="relative mx-auto max-w-7xl px-gutter py-28 md:py-40">
        <Reveal>
          <EyebrowRule eyebrow={dict.contact.eyebrow} />
          <h2 className="display-lg mt-6 max-w-4xl">{dict.contact.title}</h2>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-bone/70">
            {dict.contact.body}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-3 p-8 border border-bone/10 bg-charcoal/40 rounded-md transition-colors hover:border-bone/25 hover:bg-charcoal/60"
            >
              <Smartphone className="h-5 w-5 text-crimson" aria-hidden="true" />
              <h3 className="display-md">{dict.contact.whatsapp.label}</h3>
              <p className="text-sm text-bone/60">{dict.contact.whatsapp.number}</p>
            </a>
            <a
              href={mailtoUrl}
              className="flex flex-col gap-3 p-8 border border-bone/10 bg-charcoal/40 rounded-md transition-colors hover:border-bone/25 hover:bg-charcoal/60"
            >
              <Mail className="h-5 w-5 text-crimson" aria-hidden="true" />
              <h3 className="display-md">{dict.contact.email.label}</h3>
              <p className="text-sm text-bone/60">{dict.contact.email.address}</p>
            </a>
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="flex flex-col gap-3 p-8 border border-bone/10 bg-charcoal/40 rounded-md transition-colors hover:border-bone/25 hover:bg-charcoal/60"
            >
              <Phone className="h-5 w-5 text-crimson" aria-hidden="true" />
              <h3 className="display-md">{dict.contact.phone.label}</h3>
              <p className="text-sm text-bone/60">{dict.contact.phone.number}</p>
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-14 max-w-2xl">
            <h3 className="display-md mb-6">{dict.contact.form.title}</h3>
            <FeedbackBanner dict={dict} error={error} success={message} />
            <form action={submitEnquiryAction} noValidate>
              <input type="hidden" name="locale" value={locale} />
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
                  >
                    {dict.contact.form.name.label}
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
                    placeholder={dict.contact.form.name.placeholder}
                    aria-required="true"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
                  >
                    {dict.contact.form.email.label}
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
                    placeholder={dict.contact.form.email.placeholder}
                    aria-required="true"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
                    >
                      {dict.contact.form.phone.label}
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
                      placeholder={dict.contact.form.phone.placeholder}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-business"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
                    >
                      {dict.contact.form.business.label}
                    </label>
                    <input
                      id="contact-business"
                      name="business_name"
                      type="text"
                      autoComplete="organization"
                      className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
                      placeholder={dict.contact.form.business.placeholder}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="contact-service"
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
                  >
                    {dict.contact.form.service.label}
                  </label>
                  <select
                    id="contact-service"
                    name="service_type"
                    required
                    className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20 bg-charcoal"
                  >
                    <option value="">{dict.contact.form.service.placeholder}</option>
                    {SERVICES.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="contact-description"
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-bone/50 mb-1"
                  >
                    {dict.contact.form.description.label}
                  </label>
                  <textarea
                    id="contact-description"
                    name="project_description"
                    rows={5}
                    required
                    className="w-full rounded border px-3 py-2 text-sm focus-visible:border-crimson focus-visible:outline-none transition-colors border-bone/20"
                    placeholder={dict.contact.form.description.placeholder}
                  />
                </div>
                <SubmitButton>
                  {dict.contact.form.submit}
                </SubmitButton>
              </div>
            </form>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
