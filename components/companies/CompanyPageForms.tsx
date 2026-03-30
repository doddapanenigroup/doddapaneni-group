'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { leadFormVariantFromSectorSlug } from '@/lib/company-lead-variant';
import CompanyLeadForm from '@/components/companies/CompanyLeadForm';

type Props = {
  companySlug: string;
  sectorSlug: string;
  companyDisplayName?: string;
};

export default function CompanyPageForms({ companySlug, sectorSlug, companyDisplayName }: Props) {
  const t = useTranslations('CompanyForms');
  const variant = leadFormVariantFromSectorSlug(sectorSlug);

  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cMessage, setCMessage] = useState('');
  const [cStatus, setCStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');

  const inputClass =
    'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/30';
  const labelClass = 'mb-1 block text-sm font-semibold text-slate-800';

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cMessage.trim().length < 10) {
      alert(t('contactMessageMin'));
      return;
    }
    setCStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cName,
          email: cEmail,
          message: cMessage,
          companySlug,
          sectorSlug,
          companyPageLabel: companyDisplayName,
        }),
      });
      if (!res.ok) {
        setCStatus('err');
        return;
      }
      setCStatus('ok');
      setCName('');
      setCEmail('');
      setCMessage('');
    } catch {
      setCStatus('err');
    }
  };

  return (
    <section className="border-t border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <span className="inline-block h-0.5 w-10 rounded-full bg-blue-800" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{t('leadTitle')}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{t('leadIntro')}</p>
          <div className="mt-8">
            <CompanyLeadForm
              variant={variant}
              companySlug={companySlug}
              sectorSlug={sectorSlug}
              companyDisplayName={companyDisplayName}
            />
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('contactTitle')}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{t('contactIntro')}</p>
          <form onSubmit={submitContact} className="mx-auto mt-8 max-w-2xl space-y-4">
            <div>
              <label htmlFor="co-contact-name" className={labelClass}>
                {t('fieldFullName')} <span className="text-red-600">*</span>
              </label>
              <input
                id="co-contact-name"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                required
                className={inputClass}
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="co-contact-email" className={labelClass}>
                {t('fieldEmail')} <span className="text-red-600">*</span>
              </label>
              <input
                id="co-contact-email"
                type="email"
                value={cEmail}
                onChange={(e) => setCEmail(e.target.value)}
                required
                className={inputClass}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="co-contact-msg" className={labelClass}>
                {t('fieldMessage')} <span className="text-red-600">*</span>
              </label>
              <textarea
                id="co-contact-msg"
                value={cMessage}
                onChange={(e) => setCMessage(e.target.value)}
                required
                minLength={10}
                rows={5}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={cStatus === 'sending'}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {cStatus === 'sending' ? t('submitting') : t('contactSubmit')}
            </button>
            {cStatus === 'ok' ? <p className="text-sm font-medium text-emerald-700">{t('contactSuccess')}</p> : null}
            {cStatus === 'err' ? <p className="text-sm font-medium text-red-600">{t('contactError')}</p> : null}
          </form>
        </div>
      </div>
    </section>
  );
}
