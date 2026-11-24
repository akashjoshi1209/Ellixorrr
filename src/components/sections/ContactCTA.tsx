"use client";

import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Phone, Smartphone } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { EyebrowRule } from "@/components/sections/SectionShell";
import { submitEnquiryAction } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { ErrorCode, SuccessCode } from "@/lib/feedback";

const WHATSAPP_NUMBER = "919404044607";
const EMAIL_ADDRESS = "ellixorrr@gmail.com";
const PHONE_NUMBER = "+919404044607";

type ContactCTAProps = {
  dict: Dictionary;
  locale: Locale;
};

const SERVICES = ["Websites", "Applications", "Automations", "Custom Solutions"];

/** Client-side validation mirroring the Zod rules in src/lib/validations.ts */
function validateForm(
  formData: FormData,
  dict: Dictionary,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = (formData.get("name") ?? "").toString().trim();
  const email = (formData.get("email") ?? "").toString().trim();
  const phone = (formData.get("phone") ?? "").toString().trim();
  const business_name = (formData.get("business_name") ?? "").toString().trim();
  const service_type = (formData.get("service_type") ?? "").toString();
  const project_description = (formData.get("project_description") ?? "").toString().trim();

  if (!name) {
    errors.name = dict.contact.form.required;
  } else if (name.length > 100) {
    errors.name = dict.contact.form.required;
  }

  if (!email) {
    errors.email = dict.contact.form.required;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = dict.contact.form.invalidEmail;
  } else if (email.length > 254) {
    errors.email = dict.contact.form.invalidEmail;
  }

  if (phone && phone.length > 30) {
    errors.phone = dict.contact.form.required;
  }

  if (business_name && business_name.length > 100) {
    errors.business_name = dict.contact.form.required;
  }

  if (!service_type || !SERVICES.includes(service_type)) {
    errors.service_type = dict.contact.form.required;
  }

  if (!project_description) {
    errors.project_description = dict.contact.form.required;
  } else if (project_description.length > 5000) {
    errors.project_description = dict.contact.form.required;
  }

  return errors;
}

export function ContactCTA({ dict, locale }: ContactCTAProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || undefined;
  const message = searchParams.get("message") || undefined;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(dict.contact.whatsapp.message)}`;
  const mailtoUrl = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(dict.contact.email.subject)}`;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<ErrorCode | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<SuccessCode | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formRef.current) return;

      const formData = new FormData(formRef.current);
      const fieldErrors = validateForm(formData, dict);
      setErrors(fieldErrors);

      if (Object.keys(fieldErrors).length > 0) {
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await submitEnquiryAction(formData);
        if ("error" in result) {
          setSubmissionError(result.error as ErrorCode);
        } else {
          setSubmissionSuccess(result.success as SuccessCode);
          formRef.current.reset();
          setErrors({});
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [dict],
  );

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
            <FeedbackBanner dict={dict} error={error || submissionError} success={message || submissionSuccess} />
            <form ref={formRef} onSubmit={handleSubmit} noValidate>
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
                    aria-describedby={errors.name ? "contact-name-error" : undefined}
                    onChange={() => clearFieldError("name")}
                    defaultValue=""
                  />
                  {errors.name && (
                    <p
                      id="contact-name-error"
                      className="mt-1 text-sm text-crimson/70"
                      role="alert"
                    >
                      {errors.name}
                    </p>
                  )}
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
                    aria-describedby={errors.email ? "contact-email-error" : undefined}
                    onChange={() => clearFieldError("email")}
                    defaultValue=""
                  />
                  {errors.email && (
                    <p
                      id="contact-email-error"
                      className="mt-1 text-sm text-crimson/70"
                      role="alert"
                    >
                      {errors.email}
                    </p>
                  )}
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
                      aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                      onChange={() => clearFieldError("phone")}
                      defaultValue=""
                    />
                    {errors.phone && (
                      <p
                        id="contact-phone-error"
                        className="mt-1 text-sm text-crimson/70"
                        role="alert"
                      >
                        {errors.phone}
                      </p>
                    )}
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
                      aria-describedby={errors.business_name ? "contact-business-error" : undefined}
                      onChange={() => clearFieldError("business_name")}
                      defaultValue=""
                    />
                    {errors.business_name && (
                      <p
                        id="contact-business-error"
                        className="mt-1 text-sm text-crimson/70"
                        role="alert"
                      >
                        {errors.business_name}
                      </p>
                    )}
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
                    aria-describedby={errors.service_type ? "contact-service-error" : undefined}
                    onChange={() => clearFieldError("service_type")}
                    defaultValue=""
                  >
                    <option value="">{dict.contact.form.service.placeholder}</option>
                    {SERVICES.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                  {errors.service_type && (
                    <p
                      id="contact-service-error"
                      className="mt-1 text-sm text-crimson/70"
                      role="alert"
                    >
                      {errors.service_type}
                    </p>
                  )}
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
                    aria-describedby={errors.project_description ? "contact-description-error" : undefined}
                    onChange={() => clearFieldError("project_description")}
                    defaultValue=""
                  />
                  {errors.project_description && (
                    <p
                      id="contact-description-error"
                      className="mt-1 text-sm text-crimson/70"
                      role="alert"
                    >
                      {errors.project_description}
                    </p>
                  )}
                </div>
                <SubmitButton isSubmitting={isSubmitting}>
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