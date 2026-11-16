import { Hero } from "@/components/sections/Hero";
import { BrandIntro } from "@/components/sections/BrandIntro";
import { Services } from "@/components/sections/Services";
import { WhyEllixorrr } from "@/components/sections/WhyEllixorrr";
import { Process } from "@/components/sections/Process";
import { Work } from "@/components/sections/Work";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale as Locale);

  return (
    <>
      <Hero dict={dict} />
      <BrandIntro dict={dict} />
      <Services dict={dict} />
      <WhyEllixorrr dict={dict} />
      <Process dict={dict} />
      <Work dict={dict} />
      <Suspense fallback={<div>Loading contact section...</div>}>
        <ContactCTA dict={dict} />
      </Suspense>
    </>
  );
}
