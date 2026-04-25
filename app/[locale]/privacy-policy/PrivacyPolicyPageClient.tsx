'use client';

import { useTranslations, useAppLocale as useLocale } from '@/lib/dictionary-react';
import { Link } from '@/i18n/navigation';
import { Shield, ExternalLink } from 'lucide-react';

function PolicyLink({
  href,
  label,
  title,
}: {
  href: string;
  label: string;
  title: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="inline-flex items-center gap-1 font-semibold text-blue-800 underline-offset-2 hover:text-blue-950 hover:underline"
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
    </a>
  );
}

export default function PrivacyPolicyPageClient() {
  const locale = useLocale();
  const t = useTranslations('PrivacyPolicy');

  const toc = [
    { id: 'section-data', label: t('tocData') },
    { id: 'section-cookies', label: t('tocCookies') },
    { id: 'section-third-party', label: t('tocThirdParty') },
    { id: 'section-use', label: t('tocUse') },
    { id: 'section-security', label: t('tocSecurity') },
    { id: 'section-rights', label: t('tocRights') },
    { id: 'section-changes', label: t('tocChanges') },
  ] as const;

  return (
      <article className="min-h-screen bg-white">
        <header className="bg-gradient-to-b from-blue-950 to-blue-900 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                <Shield className="text-white" size={26} aria-hidden />
              </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300 sm:text-xs">
              Doddapaneni Group
            </p>
            <h1 className="mt-1.5 text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl">{t('title')}</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">{t('subtitle')}</p>
            <p className="mt-2 text-xs text-blue-200/90 sm:text-sm">{t('lastUpdated')}</p>
          </div>
        </header>

        <div className="border-t border-blue-100/60 bg-slate-50 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <nav
              aria-label={t('tocAriaLabel')}
              className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('tocIntro')}</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800 marker:font-semibold marker:text-blue-800">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="text-blue-800 underline-offset-2 hover:underline">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="space-y-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:space-y-14 md:p-10">
              <section>
                <p className="leading-relaxed text-slate-700">{t('introduction')}</p>
              </section>

              <section id="section-data" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('informationWeCollect')}</h2>
                <p className="mt-3 font-medium text-slate-800">{t('informationWeCollectLead')}</p>
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t('informationWeCollectYouProvideTitle')}</h3>
                    <p className="mt-2 leading-relaxed text-slate-700">{t('informationWeCollectYouProvideDesc')}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t('informationWeCollectAutoTitle')}</h3>
                    <p className="mt-2 leading-relaxed text-slate-700">{t('informationWeCollectAutoDesc')}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t('informationWeCollectSensitiveTitle')}</h3>
                    <p className="mt-2 leading-relaxed text-slate-700">{t('informationWeCollectSensitiveDesc')}</p>
                  </div>
                </div>
              </section>

              <section id="section-cookies" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('cookies')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('cookiesLead')}</p>
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t('cookiesEssentialTitle')}</h3>
                    <p className="mt-2 leading-relaxed text-slate-700">{t('cookiesEssentialDesc')}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t('cookiesAnalyticsTitle')}</h3>
                    <p className="mt-2 leading-relaxed text-slate-700">{t('cookiesAnalyticsDesc')}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t('cookiesAdvertisingTitle')}</h3>
                    <p className="mt-2 leading-relaxed text-slate-700">{t('cookiesAdvertisingDesc')}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t('cookiesChoicesTitle')}</h3>
                    <p className="mt-2 leading-relaxed text-slate-700">{t('cookiesChoicesDesc')}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      <li>
                        <PolicyLink
                          href="https://adssettings.google.com/"
                          label={t('googleAdsSettingsLabel')}
                          title={t('externalLinkTitle')}
                        />
                      </li>
                      <li>
                        <PolicyLink
                          href="https://optout.networkadvertising.org/"
                          label={t('naIResourceLabel')}
                          title={t('externalLinkTitle')}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section id="section-third-party" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('thirdParty')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('thirdPartyLead')}</p>
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t('thirdPartyGoogleTitle')}</h3>
                    <p className="mt-2 leading-relaxed text-slate-700">{t('thirdPartyGoogleDesc')}</p>
                    <ul className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6">
                      <li>
                        <PolicyLink
                          href="https://policies.google.com/technologies/partner-sites"
                          label={t('partnerSitesLinkLabel')}
                          title={t('externalLinkTitle')}
                        />
                      </li>
                      <li>
                        <PolicyLink
                          href="https://policies.google.com/privacy"
                          label={t('googlePrivacyLinkLabel')}
                          title={t('externalLinkTitle')}
                        />
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t('thirdPartyOtherTitle')}</h3>
                    <p className="mt-2 leading-relaxed text-slate-700">{t('thirdPartyOtherDesc')}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t('thirdPartyLiabilityTitle')}</h3>
                    <p className="mt-2 leading-relaxed text-slate-700">{t('thirdPartyLiabilityDesc')}</p>
                  </div>
                </div>

                <div
                  className="mt-8 rounded-xl border border-amber-200/80 bg-amber-50/90 p-5 text-sm leading-relaxed text-amber-950 md:text-base"
                  role="note"
                >
                  <h3 className="font-bold text-amber-950">{t('adsenseNoticeTitle')}</h3>
                  <p className="mt-2 text-amber-950/95">{t('adsenseNoticeDesc')}</p>
                </div>
              </section>

              <section id="section-use" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('howWeUse')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('howWeUseDesc')}</p>
              </section>

              <section id="section-security" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('dataProtection')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('dataProtectionDesc')}</p>
              </section>

              <section id="section-rights" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('yourRights')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('yourRightsDesc')}</p>
                <p className="mt-4 text-sm text-slate-600">
                  <Link href="/contact" locale={locale} className="font-semibold text-blue-800 hover:underline">
                    {t('contactPageLink')}
                  </Link>
                </p>
                <div className="mt-8 space-y-6 border-t border-slate-100 pt-8">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t('childrenTitle')}</h3>
                    <p className="mt-2 leading-relaxed text-slate-700">{t('childrenDesc')}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t('internationalTitle')}</h3>
                    <p className="mt-2 leading-relaxed text-slate-700">{t('internationalDesc')}</p>
                  </div>
                </div>
              </section>

              <section id="section-changes" className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('changes')}</h2>
                <p className="mt-3 leading-relaxed text-slate-700">{t('changesDesc')}</p>
              </section>
            </div>
          </div>
        </div>
      </article>
  );
}
