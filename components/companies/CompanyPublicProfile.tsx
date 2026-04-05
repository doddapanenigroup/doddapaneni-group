import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ExternalLink } from 'lucide-react';

export type CompanySocialLink = { label: string; href: string };

type Props = {
  locale: string;
  companyName: string;
  companySlug: string;
  /** Normalized image URL or null */
  logoSrc: string | null;
  description: string | null;
  websiteUrl: string | null;
  sectorName: string;
  sectorSlug: string;
  /** Resolved hero image URL (stored hero or sector default). */
  heroSrc: string;
  aboutParagraphs: string[];
  socials: CompanySocialLink[];
};

/**
 * Public company profile: header (logo, description, website) + main (title, sector,
 * top-right image with text wrapping, then full-width continuation, then socials).
 * Single layout for all DB-backed company pages — keep in sync with product wireframe.
 */
export default function CompanyPublicProfile({
  locale,
  companyName,
  companySlug,
  logoSrc,
  description,
  websiteUrl,
  sectorName,
  sectorSlug,
  heroSrc,
  aboutParagraphs,
  socials,
}: Props) {
  const figureClassName = [
    'relative mb-6 overflow-hidden rounded-xl border border-blue-200 bg-slate-100 shadow-sm',
    'aspect-[4/3] w-full max-w-lg mx-auto',
    'sm:float-right sm:mx-0 sm:mb-4 sm:ml-6 sm:mt-1 sm:w-[min(100%,20rem)] md:w-[min(100%,24rem)] lg:w-[min(100%,28rem)]',
  ].join(' ');

  return (
    <>
      <section className="bg-blue-900 pt-24 pb-8 md:pt-24 md:pb-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <div className="relative mx-auto h-12 w-[160px] overflow-hidden rounded">
            {logoSrc ? (
              <Image src={logoSrc} alt={`${companyName} logo`} fill className="object-contain" sizes="160px" />
            ) : (
              <div className="h-full w-full rounded bg-white/10" />
            )}
          </div>
          {description?.trim() ? (
            <p className="mt-2 text-blue-200 text-sm max-w-2xl mx-auto">{description.trim()}</p>
          ) : null}
          {websiteUrl?.trim() ? (
            <a
              href={websiteUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 mt-3 rounded-lg font-semibold text-blue-900 bg-white hover:bg-blue-100 transition-colors text-sm"
            >
              Visit website
              <ExternalLink size={16} strokeWidth={1.75} />
            </a>
          ) : null}
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <span className="inline-block w-12 h-0.5 rounded-full bg-blue-800 mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight text-left">{companyName}</h1>
          <p className="text-sm text-slate-600 mb-6 text-left">
            Sector:{' '}
            <Link href={`/${sectorSlug}`} locale={locale} className="font-semibold text-blue-900 hover:underline">
              {sectorName}
            </Link>
          </p>

          <div className="flow-root">
            <figure className={figureClassName}>
              <Image
                src={heroSrc}
                alt={`${companyName} hero`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 20rem, 28rem"
                className="object-cover"
                loading="lazy"
              />
            </figure>

            {aboutParagraphs.length > 0 ? (
              <div className="space-y-4">
                {aboutParagraphs.map((p, i) => (
                  <p key={`${companySlug}-about-${i}`} className="text-slate-700 text-base leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            ) : description?.trim() ? (
              <p className="text-slate-700 text-base leading-relaxed">{description.trim()}</p>
            ) : (
              <p className="text-slate-700 text-base leading-relaxed">
                Learn more about {companyName} and get in touch with our team.
              </p>
            )}
          </div>

          {socials.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3 clear-both">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
                >
                  {s.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
