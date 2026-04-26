'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from '@/lib/dictionary-react';
import { Link } from '@/i18n/navigation';
import type { PublicCareerJob } from '@/lib/data/careers-public';

type Props = {
  job: PublicCareerJob | null;
  locale: string;
  onClose: () => void;
};

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25';

const labelClass = 'block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">{children}</h3>;
}

export default function CareersApplyModal({ job, locale, onClose }: Props) {
  const t = useTranslations('CareersPage');
  const titleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const resumeSectionRef = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  /** Red outline on resume block when user submits without a file. */
  const [resumeHighlight, setResumeHighlight] = useState(false);
  const [langPick, setLangPick] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!job) return;
    const init: Record<string, boolean> = {};
    for (const c of job.applyLanguageCodes) init[c] = false;
    setLangPick(init);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstFieldRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [job]);

  useEffect(() => {
    if (!job) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [job, onClose]);

  if (!job) return null;

  const handleClose = () => {
    setStatus('idle');
    setErrorMessage('');
    setResumeHighlight(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setErrorMessage('');
    setResumeHighlight(false);

    const resumeEl = form.elements.namedItem('resume');
    const fileInput = resumeEl instanceof HTMLInputElement ? resumeEl : null;
    const f = fileInput?.files?.[0];
    if (!f || f.size === 0) {
      setStatus('error');
      setResumeHighlight(true);
      setErrorMessage(t('applyResumeAttachRequired'));
      requestAnimationFrame(() => {
        resumeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    setStatus('sending');

    const fd = new FormData(form);
    fd.set('jobSlug', job.slug);
    fd.set('locale', locale);

    const chosen = job.applyLanguageCodes.filter((c) => langPick[c]);
    if (!chosen.length) {
      setStatus('error');
      setErrorMessage(t('applyLanguagesRequired'));
      return;
    }
    for (const c of chosen) {
      fd.append('languagesKnown', c);
    }

    try {
      const res = await fetch('/api/careers/apply', {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        message?: string;
      };

      if (!res.ok || data.ok !== true) {
        setStatus('error');
        if (data.code === 'INBOX_DELIVERY_FAILED') {
          setErrorMessage(t('applyFormSubmitInboxFailed'));
        } else if (data.code === 'MAIL_NOT_CONFIGURED') {
          setErrorMessage(t('applyFormSubmitMailNotConfigured'));
        } else {
          setErrorMessage((data.message || '').trim() || t('applyFormError'));
        }
        return;
      }

      form.reset();
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage(t('applyFormError'));
    }
  };

  const resumeSectionRing = resumeHighlight
    ? 'rounded-xl ring-2 ring-red-500 ring-offset-2 ring-offset-white'
    : 'rounded-xl';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/45 p-3 backdrop-blur-[1px] sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(94vh,880px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{t('applyFormEyebrow')}</p>
            <h2 id={titleId} className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {job.title}
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">{job.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={t('applyFormCloseAria')}
          >
            <X size={22} aria-hidden />
          </button>
        </div>

        {status === 'success' ? (
          <div className="overflow-y-auto px-5 py-12 text-center sm:px-8">
            <p className="text-lg font-semibold text-slate-900">{t('applyFormSuccessTitle')}</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">{t('applyFormSuccessSimpleBody')}</p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {t('applyFormClose')}
            </button>
          </div>
        ) : (
          <form
            key={job.slug}
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
              <input type="text" name="fax" defaultValue="" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden />

              <section>
                <SectionTitle>{t('applySectionPersonal')}</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ca-name" className={labelClass}>
                      {t('applyFieldFullName')}
                    </label>
                    <input
                      ref={firstFieldRef}
                      id="ca-name"
                      name="name"
                      required
                      autoComplete="name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="ca-email" className={labelClass}>
                      {t('applyFieldEmail')}
                    </label>
                    <input
                      id="ca-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="ca-phone" className={labelClass}>
                      {t('applyFieldPhone')}
                    </label>
                    <input id="ca-phone" name="phone" type="tel" autoComplete="tel" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="ca-location" className={labelClass}>
                      {t('applyFieldLocation')}
                    </label>
                    <input id="ca-location" name="location" autoComplete="address-level2" className={inputClass} />
                  </div>
                </div>
              </section>

              <section>
                <SectionTitle>{t('applySectionJob')}</SectionTitle>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ca-position" className={labelClass}>
                      {t('applyFieldPosition')}
                    </label>
                    <input
                      id="ca-position"
                      name="positionApplied"
                      required
                      defaultValue={job.title}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <p className={labelClass}>{t('applySectionLanguages')}</p>
                    <p className="mt-1 text-xs font-normal normal-case text-slate-500">{t('applyLanguagesHint')}</p>
                    <div className="mt-3 flex flex-wrap gap-4">
                      {job.applyLanguageCodes.map((code) => (
                        <label
                          key={code}
                          className="flex cursor-pointer items-center gap-2 text-sm font-normal normal-case text-slate-800"
                        >
                          <input
                            type="checkbox"
                            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/40"
                            checked={!!langPick[code]}
                            onChange={(e) =>
                              setLangPick((p) => ({ ...p, [code]: e.target.checked }))
                            }
                          />
                          {code === 'en' ? t('applyLangEn') : code === 'te' ? t('applyLangTe') : t('applyLangHi')}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ca-employment" className={labelClass}>
                        {t('applyFieldEmploymentType')}
                      </label>
                      <select id="ca-employment" name="employmentType" className={inputClass}>
                        <option value="">{t('applyEmploymentPlaceholder')}</option>
                        <option value="Full-time">{t('applyEmploymentFullTime')}</option>
                        <option value="Part-time">{t('applyEmploymentPartTime')}</option>
                        <option value="Contract">{t('applyEmploymentContract')}</option>
                        <option value="Internship">{t('applyEmploymentInternship')}</option>
                        <option value="Freelance">{t('applyEmploymentFreelance')}</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="ca-notice" className={labelClass}>
                        {t('applyFieldNotice')}
                      </label>
                      <input
                        id="ca-notice"
                        name="availabilityNotice"
                        placeholder={t('applyFieldNoticePlaceholder')}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section ref={resumeSectionRef} className={`scroll-mt-4 ${resumeSectionRing} p-1 transition-shadow`}>
                <SectionTitle>{t('applySectionResume')}</SectionTitle>
                <div>
                  <label htmlFor="ca-resume" className={labelClass}>
                    {t('applyFieldResume')}
                  </label>
                  <input
                    id="ca-resume"
                    name="resume"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={() => setResumeHighlight(false)}
                    className="mt-1.5 block w-full cursor-pointer text-sm text-slate-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border file:border-slate-300 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-800 file:transition hover:file:bg-slate-200"
                  />
                  <p className="mt-2 text-xs text-slate-500">{t('applyResumeHint')}</p>
                </div>
              </section>

              <section>
                <SectionTitle>{t('applySectionSkills')}</SectionTitle>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ca-exp" className={labelClass}>
                      {t('applyFieldExperience')}
                    </label>
                    <select id="ca-exp" name="experienceYears" className={inputClass}>
                      <option value="">{t('applyExperienceSelect')}</option>
                      <option value="0–1 years">{t('applyExp01')}</option>
                      <option value="2–3 years">{t('applyExp23')}</option>
                      <option value="4–5 years">{t('applyExp45')}</option>
                      <option value="6–10 years">{t('applyExp610')}</option>
                      <option value="10+ years">{t('applyExp10p')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ca-skills" className={labelClass}>
                      {t('applyFieldKeySkills')}
                    </label>
                    <textarea
                      id="ca-skills"
                      name="keySkills"
                      required
                      minLength={10}
                      rows={5}
                      className={`${inputClass} resize-y min-h-[120px]`}
                    />
                  </div>
                </div>
              </section>

              <section>
                <SectionTitle>{t('applySectionScreening')}</SectionTitle>
                <div>
                  <label htmlFor="ca-why" className={labelClass}>
                    {t('applyFieldWhyApply')}
                  </label>
                  <textarea
                    id="ca-why"
                    name="whyApply"
                    required
                    minLength={20}
                    rows={5}
                    className={`${inputClass} resize-y min-h-[120px]`}
                  />
                </div>
              </section>

              <section>
                <SectionTitle>{t('applySectionAvailability')}</SectionTitle>
                <div>
                  <label htmlFor="ca-start" className={labelClass}>
                    {t('applyFieldStartDate')}
                  </label>
                  <input id="ca-start" name="startDate" type="date" className={inputClass} />
                </div>
              </section>

              <section>
                <SectionTitle>{t('applySectionAdditional')}</SectionTitle>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ca-li" className={labelClass}>
                      {t('applyFieldLinkedin')}
                    </label>
                    <input
                      id="ca-li"
                      name="linkedin"
                      type="url"
                      placeholder="https://"
                      autoComplete="url"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="ca-company" className={labelClass}>
                      {t('applyFieldCompany')}
                    </label>
                    <input id="ca-company" name="company" autoComplete="organization" className={inputClass} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ca-ctc" className={labelClass}>
                        {t('applyFieldCurrentCtc')}
                      </label>
                      <input id="ca-ctc" name="currentCtc" className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="ca-ectc" className={labelClass}>
                        {t('applyFieldExpectedCtc')}
                      </label>
                      <input id="ca-ectc" name="expectedCtc" className={inputClass} />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
                <SectionTitle>{t('applySectionDeclaration')}</SectionTitle>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-slate-700">
                    <input type="checkbox" name="declarationAccurate" value="1" required className="mt-0.5 size-4 shrink-0 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/40" />
                    <span>{t('applyDeclarationAccurate')}</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-slate-700">
                    <input type="checkbox" name="declarationLegal" value="1" required className="mt-0.5 size-4 shrink-0 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/40" />
                    <span>
                      {t('applyDeclarationLegalPrefix')}{' '}
                      <Link
                        href="/privacy-policy"
                        locale={locale}
                        className="font-medium text-blue-700 underline decoration-blue-500/60 underline-offset-2 hover:text-blue-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('applyPrivacyLink')}
                      </Link>
                      {t('applyDeclarationLegalAnd')}{' '}
                      <Link
                        href="/terms"
                        locale={locale}
                        className="font-medium text-blue-700 underline decoration-blue-500/60 underline-offset-2 hover:text-blue-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('applyTermsLink')}
                      </Link>
                      {t('applyDeclarationLegalSuffix')}
                    </span>
                  </label>
                </div>
              </section>

              {status === 'error' ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                  {errorMessage}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {t('applyFormCancel')}
              </button>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-700 disabled:opacity-55"
              >
                {status === 'sending' ? t('applyFormSending') : t('applyFormSubmit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
