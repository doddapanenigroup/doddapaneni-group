import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Activity,
  Building2,
  ClipboardList,
  Cpu,
  Layers,
  Megaphone,
  MonitorSmartphone,
  Package,
  Rocket,
  Shield,
  SlidersHorizontal,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getSectorBySlug, normalizeStoredImage } from '@/lib/sector-landing';
import { sectorHeroSubtitleForLocale, sectorPublicName } from '@/lib/sector-localized-copy';
import { listCompaniesBySectorSlug } from '@/lib/data/company-repository';
import SectorFeaturedBrandsGrid from '@/components/sector/SectorFeaturedBrandsGrid';

type Props = {
  locale: string;
};

export default async function HealthcareMedicalSectorLanding({ locale }: Props) {
  const sector = await getSectorBySlug('healthcare-medical');
  if (!sector) notFound();

  const companies = await listCompaniesBySectorSlug(sector.slug);
  const t = createTranslator(getDictionary(locale), 'HealthcareMedicalSector');
  const tHome = createTranslator(getDictionary(locale), 'Home');

  const sectorTitle = sectorPublicName(locale, sector.slug, sector.name);
  const heroDescription = sectorHeroSubtitleForLocale(
    locale,
    sector.slug,
    sector.description,
    sectorTitle,
  );
  const showDbCompanies = companies.length > 0;

  const serviceCards = [
    { icon: Package, title: t('serviceEquipmentTitle'), body: t('serviceEquipmentBody') },
    { icon: MonitorSmartphone, title: t('serviceItTitle'), body: t('serviceItBody') },
    { icon: Building2, title: t('serviceHospitalTitle'), body: t('serviceHospitalBody') },
    { icon: Cpu, title: t('serviceAiTitle'), body: t('serviceAiBody') },
    { icon: Shield, title: t('serviceSecurityTitle'), body: t('serviceSecurityBody') },
    { icon: Megaphone, title: t('serviceMarketingTitle'), body: t('serviceMarketingBody') },
  ] as const;

  const whyCards = [
    { icon: Cpu, title: t('whyTechTitle'), body: t('whyTechBody') },
    { icon: SlidersHorizontal, title: t('whyCustomTitle'), body: t('whyCustomBody') },
    { icon: Layers, title: t('whyEndToEndTitle'), body: t('whyEndToEndBody') },
  ] as const;

  const processSteps = [
    { icon: ClipboardList, title: t('processAssessTitle'), body: t('processAssessBody') },
    { icon: Rocket, title: t('processImplTitle'), body: t('processImplBody') },
    { icon: Activity, title: t('processMonitorTitle'), body: t('processMonitorBody') },
  ] as const;

  const benefits = [
    t('benefit1'),
    t('benefit2'),
    t('benefit3'),
    t('benefit4'),
    t('benefit5'),
    t('benefit6'),
    t('benefit7'),
    t('benefit8'),
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 px-4 pt-20 pb-8 sm:px-6 sm:pt-20 sm:pb-10 lg:px-8 lg:pt-20 lg:pb-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/90 sm:text-sm">
            {t('heroEyebrow')}
          </p>
          <h1 className="mt-3 font-serif text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-teal-100/95 md:text-base">
            {t('heroLead')}
          </p>
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
            {t('sectionComprehensiveTitle')}
          </h2>
          <div className="mt-6 max-w-5xl space-y-4 text-slate-600 md:text-lg">
            <p className="leading-relaxed">{t('sectionComprehensiveP1')}</p>
            <p className="leading-relaxed">{t('sectionComprehensiveP2')}</p>
          </div>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {serviceCards.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white">
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
          <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">{t('whyTitle')}</h2>
          <p className="mt-3 max-w-3xl text-slate-600">{t('whyLead')}</p>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {whyCards.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-6"
              >
                <Icon className="h-8 w-8 text-teal-700" aria-hidden />
                <h3 className="mt-4 font-serif text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/50 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">{t('processTitle')}</h2>
          <p className="mt-3 text-slate-600">{t('processLead')}</p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {processSteps.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="relative flex gap-4">
                <div className="flex shrink-0 flex-col items-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
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
                    <Icon className="h-4 w-4 text-teal-700" aria-hidden />
                    <h3 className="font-serif text-base font-bold text-slate-900">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">{t('benefitsTitle')}</h2>
          <p className="mt-3 text-slate-600">{t('benefitsLead')}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {benefits.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <span
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-teal-600"
                  aria-hidden
                />
                <span className="text-sm font-medium text-slate-800 md:text-base">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-gradient-to-r from-teal-900 to-emerald-950 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">{t('ctaTitle')}</h2>
          <p className="mt-4 leading-relaxed text-teal-100/95">{t('ctaBody')}</p>
          <div className="mt-8">
            <Link
              href="/contact"
              locale={locale}
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-teal-950 shadow-md transition hover:bg-teal-50"
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
                      className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
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
