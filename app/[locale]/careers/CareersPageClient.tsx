'use client';

import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { useTranslations } from '@/lib/dictionary-react';
import { Link } from '@/i18n/navigation';
import type { PublicCareerJob } from '@/lib/data/careers-public';
import CareersApplyModal from './CareersApplyModal';

export default function CareersPageClient({ jobs, locale }: { jobs: PublicCareerJob[]; locale: string }) {
  const t = useTranslations('CareersPage');
  const [applyJob, setApplyJob] = useState<PublicCareerJob | null>(null);

  return (
    <div className="min-h-screen bg-white pt-20">
      <section className="bg-blue-900 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
              <Briefcase className="text-white" size={32} aria-hidden />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{t('heroTitle')}</h1>
          <p className="mt-4 text-base leading-relaxed text-blue-100 md:text-lg">{t('heroSubtitle')}</p>
        </div>
      </section>

      <section className="border-b border-slate-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{t('cultureTitle')}</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
            <p className="text-slate-600 leading-relaxed">{t('cultureP1')}</p>
            <p className="text-slate-600 leading-relaxed">{t('cultureP2')}</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{t('rolesTitle')}</h2>
          {jobs.length === 0 ? (
            <p className="mt-6 text-slate-600">{t('rolesEmpty')}</p>
          ) : (
            <ul className="mt-8 grid gap-6 md:grid-cols-1 lg:grid-cols-1">
              {jobs.map((job) => (
                <li
                  key={job.slug}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm transition-shadow hover:shadow-md md:p-8"
                >
                  <h3 className="text-xl font-semibold text-slate-900">{job.title}</h3>
                  <p className="mt-1 text-sm font-medium text-blue-800">{job.subtitle}</p>
                  <p className="mt-4 whitespace-pre-line text-slate-600 leading-relaxed">{job.description}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setApplyJob(job)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      {job.applyLabel}
                    </button>
                    {job.applyUrl?.trim() ? (
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-blue-800 underline-offset-2 hover:underline"
                      >
                        {t('applyExternalLink')}
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{t('ctaTitle')}</h2>
          <p className="mt-3 text-slate-600 leading-relaxed">{t('ctaBody')}</p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            {t('ctaButton')}
          </Link>
        </div>
      </section>

      <CareersApplyModal job={applyJob} locale={locale} onClose={() => setApplyJob(null)} />
    </div>
  );
}
