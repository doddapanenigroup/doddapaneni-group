import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  BrainCircuit,
  Cloud,
  Code2,
  Cpu,
  Layers,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Target,
  Wrench,
  Workflow,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getSectorBySlug, normalizeStoredImage } from '@/lib/sector-landing';
import { sectorHeroSubtitleForLocale, sectorPublicName } from '@/lib/sector-localized-copy';
import { listCompaniesBySectorSlug } from '@/lib/data/company-repository';
import SectorFeaturedBrandsGrid from '@/components/sector/SectorFeaturedBrandsGrid';

type Props = {
  locale: string;
};

export default async function SoftwareItAiSectorLanding({ locale }: Props) {
  const sector = await getSectorBySlug('software-it-ai');
  if (!sector) notFound();

  const companies = await listCompaniesBySectorSlug(sector.slug);
  const t = createTranslator(getDictionary(locale), 'SoftwareItAiSector');
  const tHome = createTranslator(getDictionary(locale), 'Home');

  const sectorTitle = sectorPublicName(locale, sector.slug, sector.name);
  const heroDescription = sectorHeroSubtitleForLocale(
    locale,
    sector.slug,
    sector.description,
    sectorTitle,
  );
  const showDbCompanies = companies.length > 0;

  const heroExtra = [t('heroLeadP2'), t('heroLeadP3')].map((s) => s.trim()).filter(Boolean);

  const needBenefits = [
    t('benefitNeed1'),
    t('benefitNeed2'),
    t('benefitNeed3'),
    t('benefitNeed4'),
    t('benefitNeed5'),
    t('benefitNeed6'),
    t('benefitNeed7'),
  ];

  const serviceCards = [
    {
      icon: Code2,
      title: t('serviceCustomTitle'),
      body: t('serviceCustomBody'),
    },
    {
      icon: MessageSquare,
      title: t('serviceConsultingTitle'),
      body: t('serviceConsultingBody'),
    },
    {
      icon: Workflow,
      title: t('serviceAutomationTitle'),
      body: t('serviceAutomationBody'),
    },
    {
      icon: BrainCircuit,
      title: t('serviceAiTitle'),
      body: t('serviceAiBody'),
    },
    {
      icon: Cloud,
      title: t('serviceCloudTitle'),
      body: t('serviceCloudBody'),
    },
  ] as const;

  const industryCards = [
    { title: t('industryHealthcareTitle'), body: t('industryHealthcareBody') },
    { title: t('industryRetailTitle'), body: t('industryRetailBody') },
    { title: t('industryRealEstateTitle'), body: t('industryRealEstateBody') },
    { title: t('industryEducationTitle'), body: t('industryEducationBody') },
    { title: t('industryFinanceTitle'), body: t('industryFinanceBody') },
  ] as const;

  const whyCards = [
    { icon: Cpu, title: t('whyTechTitle'), body: t('whyTechBody') },
    { icon: Target, title: t('whyCustomTitle'), body: t('whyCustomBody') },
    { icon: ShieldCheck, title: t('whyScalableTitle'), body: t('whyScalableBody') },
    { icon: Lightbulb, title: t('whyLatestTitle'), body: t('whyLatestBody') },
    { icon: Layers, title: t('whySupportTitle'), body: t('whySupportBody') },
  ] as const;

  const digitalGrowthBullets = [
    t('digitalGrowthBullet1'),
    t('digitalGrowthBullet2'),
    t('digitalGrowthBullet3'),
    t('digitalGrowthBullet4'),
    t('digitalGrowthBullet5'),
    t('digitalGrowthBullet6'),
  ];

  const processSteps = [
    { icon: Search, title: t('processReqTitle'), body: t('processReqBody') },
    { icon: Wrench, title: t('processDevTitle'), body: t('processDevBody') },
    { icon: Rocket, title: t('processTestTitle'), body: t('processTestBody') },
    { icon: RefreshCw, title: t('processMaintTitle'), body: t('processMaintBody') },
  ] as const;

  const comprehensiveP2 = t('sectionComprehensiveP2').trim();

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-4 pt-20 pb-8 sm:px-6 sm:pt-20 sm:pb-10 lg:px-8 lg:pt-20 lg:pb-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/90 sm:text-sm">
            {t('heroEyebrow')}
          </p>
          <h1 className="mt-3 font-serif text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-blue-100/95 md:text-base">
            {t('heroLead')}
          </p>
          {heroExtra.map((para, i) => (
            <p
              key={`hero-extra-${i}`}
              className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-blue-100/95 md:text-base"
            >
              {para}
            </p>
          ))}
          {heroDescription ? (
            <p className="mx-auto mt-4 max-w-3xl border-t border-white/10 pt-4 text-sm leading-relaxed text-slate-300 md:text-base">
              {heroDescription}
            </p>
          ) : null}
        </div>
      </section>

      <SectorFeaturedBrandsGrid
        locale={locale}
        sectorSlug={sector.slug}
        bordered
        headingOverride={t('featuredProductsHeading')}
        leadOverride={t('featuredProductsLead')}
      />

      <section className="border-b border-slate-100 bg-slate-50/90 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
            {t('sectionWhyNeedTitle')}
          </h2>
          <p className="mt-6 max-w-5xl text-slate-600 md:text-lg leading-relaxed">{t('sectionWhyNeedP1')}</p>
          <ul className="mt-6 max-w-5xl list-disc space-y-2 pl-5 text-slate-600 md:text-lg">
            {needBenefits.map((item) => (
              <li key={item} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-5xl text-slate-600 md:text-lg leading-relaxed">{t('sectionWhyNeedP2')}</p>

          <h2 className="mt-14 font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
            {t('sectionComprehensiveTitle')}
          </h2>
          <div className="mt-6 max-w-5xl space-y-4 text-slate-600 md:text-lg">
            <p className="leading-relaxed">{t('sectionComprehensiveP1')}</p>
            {comprehensiveP2 ? <p className="leading-relaxed">{comprehensiveP2}</p> : null}
          </div>

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {serviceCards.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">{t('industriesTitle')}</h2>
          <p className="mt-3 max-w-3xl text-slate-600 md:text-lg leading-relaxed">{t('industriesLead')}</p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {industryCards.map(({ title, body }) => (
              <li
                key={title}
                className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-6"
              >
                <h3 className="font-serif text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/50 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">{t('whyTitle')}</h2>
          <p className="mt-3 max-w-3xl text-slate-600 leading-relaxed">{t('whyLead')}</p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {whyCards.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-6"
              >
                <Icon className="h-8 w-8 text-blue-700" aria-hidden />
                <h3 className="mt-4 font-serif text-base font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">{t('digitalGrowthTitle')}</h2>
          <p className="mt-4 text-slate-600 md:text-lg leading-relaxed">{t('digitalGrowthP1')}</p>
          <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-600 md:text-lg">
            {digitalGrowthBullets.map((item) => (
              <li key={item} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-slate-600 md:text-lg leading-relaxed">{t('digitalGrowthP2')}</p>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-slate-50/90 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">{t('futureTitle')}</h2>
          <div className="mt-6 space-y-4 text-slate-600 md:text-lg leading-relaxed">
            <p>{t('futureP1')}</p>
            <p>{t('futureP2')}</p>
            <p>{t('futureP3')}</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">{t('processTitle')}</h2>
          <p className="mt-3 text-slate-600">{t('processLead')}</p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="relative flex gap-4">
                <div className="flex shrink-0 flex-col items-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  {i < processSteps.length - 1 ? (
                    <span
                      className="mt-2 hidden h-full min-h-[2rem] w-px bg-slate-200 lg:block"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-blue-700" aria-hidden />
                    <h3 className="font-serif text-base font-bold text-slate-900">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-900 to-indigo-950 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">{t('ctaTitle')}</h2>
          <p className="mt-4 text-blue-100/95 leading-relaxed">{t('ctaBody')}</p>
          <p className="mt-4 text-sm leading-relaxed text-blue-200/95 sm:text-base">{t('ctaSubline')}</p>
          <div className="mt-8">
            <Link
              href="/contact"
              locale={locale}
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-blue-950 shadow-md transition hover:bg-blue-50"
            >
              {t('ctaButton')}
            </Link>
          </div>
        </div>
      </section>

      {showDbCompanies ? (
        <section aria-labelledby="sector-db-companies-heading" className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2
              id="sector-db-companies-heading"
              className="mb-2 font-serif text-2xl font-bold text-slate-900 sm:text-3xl"
            >
              {t('productsHeading')}
            </h2>
            <p className="mb-8 text-sm text-slate-600 sm:text-base">{t('productsLead')}</p>

            <ul className="space-y-4">
              {companies.map((c) => {
                const href = `/companies/${c.slug}`;
                const logoSrc = normalizeStoredImage(c.logoImage);
                return (
                  <li key={c.id}>
                    <Link
                      href={href}
                      locale={locale}
                      className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="relative h-14 w-32 shrink-0 sm:h-16 sm:w-36">
                        {logoSrc ? (
                          <Image
                            src={logoSrc}
                            alt={c.name}
                            fill
                            className="object-contain object-left"
                            sizes="144px"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full rounded-lg bg-slate-100" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-slate-900">{c.name}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                          {c.description?.trim() || tHome('sectorCompaniesListRowHint')}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
