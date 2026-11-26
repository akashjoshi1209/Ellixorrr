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
import { isServiceType, SERVICE_TYPES } from "@/lib/services";
import { CONTACT, mailtoUrl, whatsappUrl } from "@/lib/site-config";

type ContactCTAProps = {
  dict: Dictionary;
  locale: Locale;
};

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
    errors.name = dict.contact.form.tooLong;
  }

  if (!email) {
    errors.email = dict.contact.form.required;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = dict.contact.form.invalidEmail;
  } else if (email.length > 254) {
    errors.email = dict.contact.form.tooLong;
  }

  if (phone && phone.length > 30) {
    errors.phone = dict.contact.form.tooLong;
  }

  if (business_name && business_name.length > 100) {
    errors.business_name = dict.contact.form.tooLong;
  }

  if (!isServiceType(service_type)) {
    errors.service_type = dict.contact.form.required;
  }

  if (!project_description) {
    errors.project_description = dict.contact.form.required;
  } else if (project_description.length > 5000) {
    errors.project_description = dict.contact.form.tooLong;
  }

  return errors;
}

export function ContactCTA({ dict, locale }: ContactCTAProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || undefined;
  const message = searchParams.get("message") || undefined;

  const whatsappHref = whatsappUrl(dict.contact.whatsapp.message);
  const mailtoHref = mailtoUrl(dict.contact.email.subject);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<ErrorCode | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<SuccessCode | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const inputClass = (hasError: boolean) =>
    `w-full rounded border px-3 py-2 text-sm transition-colors focus-visible:border-crimson focus-visible:outline-none ${
      hasError ? "border-crimson bg-crimson/[0.03]" : "border-rule-strong"
    }`;

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

      const firstInvalidField = Object.keys(fieldErrors)[0];
      if (firstInvalidField) {
        const control = formRef.current.elements.namedItem(firstInvalidField);
        if (control instanceof HTMLElement) control.focus();
        return;
      }

      setSubmissionError(null);
      setSubmissionSuccess(null);
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
      } catch {
        // The server action never exposes raw transport/database text.
        setSubmissionError("enquiry_failed");
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
      className="relative overflow-hidden border-t border-rule bg-charcoal"
    >
      <div aria-hidden="true" className="absolute inset-0 forest-glow [--glow-x:20%] [--glow-y:100%]" />
      <div className="relative mx-auto max-w-7xl px-gutter py-28 md:py-40">
        <Reveal>
          <EyebrowRule eyebrow={dict.contact.eyebrow} />
          <h2 className="display-lg mt-6 max-w-4xl">{dict.contact.title}</h2>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-muted">
            {dict.contact.body}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-3 p-8 border border-rule bg-forest/40 rounded-md transition-colors hover:border-rule-strong hover:bg-forest/60"
            >
              <Smartphone className="h-5 w-5 text-crimson-bright" aria-hidden="true" />
              <h3 className="display-md">{dict.contact.whatsapp.label}</h3>
              <p className="text-sm text-muted">{dict.contact.whatsapp.number}</p>
            </a>
            <a
              href={mailtoHref}
              className="flex flex-col gap-3 p-8 border border-rule bg-forest/40 rounded-md transition-colors hover:border-rule-strong hover:bg-forest/60"
            >
              <Mail className="h-5 w-5 text-crimson-bright" aria-hidden="true" />
              <h3 className="display-md">{dict.contact.email.label}</h3>
              <p className="text-sm text-muted">{dict.contact.email.address}</p>
            </a>
            <a
              href={`tel:${CONTACT.phoneDial}`}
              className="flex flex-col gap-3 p-8 border border-rule bg-forest/40 rounded-md transition-colors hover:border-rule-strong hover:bg-forest/60"
            >
              <Phone className="h-5 w-5 text-crimson-bright" aria-hidden="true" />
              <h3 className="display-md">{dict.contact.phone.label}</h3>
              <p className="text-sm text-muted">{dict.contact.phone.number}</p>
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-14 max-w-2xl">
            <h3 className="display-md mb-6">{dict.contact.form.title}</h3>
            <p className="mb-4 text-sm leading-relaxed text-muted">
              {dict.contact.form.nextStep}
            </p>
            <FeedbackBanner dict={dict} error={error || submissionError} success={message || submissionSuccess} />
            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              <input type="hidden" name="locale" value={locale} />
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1"
                  >
                    {dict.contact.form.name.label}
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={100}
                    className={inputClass(Boolean(errors.name))}
                    placeholder={dict.contact.form.name.placeholder}
                    aria-required="true"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "contact-name-error" : undefined}
                    onChange={() => clearFieldError("name")}
                    defaultValue=""
                  />
                  {errors.name && (
                    <p
                      id="contact-name-error"
                      className="mt-1 text-sm text-crimson-bright"
                      role="alert"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1"
                  >
                    {dict.contact.form.email.label}
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    className={inputClass(Boolean(errors.email))}
                    placeholder={dict.contact.form.email.placeholder}
                    aria-required="true"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "contact-email-error" : undefined}
                    onChange={() => clearFieldError("email")}
                    defaultValue=""
                  />
                  {errors.email && (
                    <p
                      id="contact-email-error"
                      className="mt-1 text-sm text-crimson-bright"
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
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1"
                    >
                      {dict.contact.form.phone.label}
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      maxLength={30}
                      className={inputClass(Boolean(errors.phone))}
                      placeholder={dict.contact.form.phone.placeholder}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                      onChange={() => clearFieldError("phone")}
                      defaultValue=""
                    />
                    {errors.phone && (
                      <p
                        id="contact-phone-error"
                        className="mt-1 text-sm text-crimson-bright"
                        role="alert"
                      >
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="contact-business"
                      className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1"
                    >
                      {dict.contact.form.business.label}
                    </label>
                    <input
                      id="contact-business"
                      name="business_name"
                      type="text"
                      autoComplete="organization"
                      maxLength={100}
                      className={inputClass(Boolean(errors.business_name))}
                      placeholder={dict.contact.form.business.placeholder}
                      aria-invalid={Boolean(errors.business_name)}
                      aria-describedby={errors.business_name ? "contact-business-error" : undefined}
                      onChange={() => clearFieldError("business_name")}
                      defaultValue=""
                    />
                    {errors.business_name && (
                      <p
                        id="contact-business-error"
                        className="mt-1 text-sm text-crimson-bright"
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
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1"
                  >
                    {dict.contact.form.service.label}
                  </label>
                  <select
                    id="contact-service"
                    name="service_type"
                    required
                    className={`${inputClass(Boolean(errors.service_type))} bg-charcoal`}
                    aria-required="true"
                    aria-invalid={Boolean(errors.service_type)}
                    aria-describedby={errors.service_type ? "contact-service-error" : undefined}
                    onChange={() => clearFieldError("service_type")}
                    defaultValue=""
                  >
                    <option value="">{dict.contact.form.service.placeholder}</option>
                    {SERVICE_TYPES.map((service, index) => (
                      <option key={service} value={service}>
                        {dict.services.items[index]?.name ?? service}
                      </option>
                    ))}
                  </select>
                  {errors.service_type && (
                    <p
                      id="contact-service-error"
                      className="mt-1 text-sm text-crimson-bright"
                      role="alert"
                    >
                      {errors.service_type}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="contact-description"
                    className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted mb-1"
                  >
                    {dict.contact.form.description.label}
                  </label>
                  <textarea
                    id="contact-description"
                    name="project_description"
                    rows={5}
                    required
                    maxLength={5000}
                    className={inputClass(Boolean(errors.project_description))}
                    placeholder={dict.contact.form.description.placeholder}
                    aria-required="true"
                    aria-invalid={Boolean(errors.project_description)}
                    aria-describedby={errors.project_description ? "contact-description-error" : undefined}
                    onChange={() => clearFieldError("project_description")}
                    defaultValue=""
                  />
                  {errors.project_description && (
                    <p
                      id="contact-description-error"
                      className="mt-1 text-sm text-crimson-bright"
                      role="alert"
                    >
                      {errors.project_description}
                    </p>
                  )}
                </div>
                <SubmitButton
                  isSubmitting={isSubmitting}
                  pendingLabel={dict.contact.form.sending}
                >
                  {dict.contact.form.submit}
                </SubmitButton>
              </div>
            </form>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              {dict.contact.form.privacyNote}
            </p>
            <noscript>
              <p className="mt-2 text-sm text-crimson-bright">
                {dict.contact.form.noscript}
              </p>
            </noscript>
          </div>
        </Reveal>
      </div>
    </section>
  );
}