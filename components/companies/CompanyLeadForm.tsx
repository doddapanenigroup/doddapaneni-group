'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { LeadFormVariant } from '@/lib/company-lead-variant';

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/30';
const labelClass = 'mb-1 block text-sm font-semibold text-slate-800';

type LeadFormSelectProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  children: React.ReactNode;
};

function LeadFormSelect({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
  children,
}: LeadFormSelectProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={inputClass}
      >
        <option value="">{placeholder ?? 'Select…'}</option>
        {children}
      </select>
    </div>
  );
}

type Props = {
  variant: LeadFormVariant;
  companySlug: string;
  sectorSlug: string;
  companyDisplayName?: string;
};

export default function CompanyLeadForm({
  variant,
  companySlug,
  sectorSlug,
  companyDisplayName,
}: Props) {
  const t = useTranslations('CompanyForms');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [timeline, setTimeline] = useState('');
  const [loanPreapproved, setLoanPreapproved] = useState('');
  const [insuranceType, setInsuranceType] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [coverageAmount, setCoverageAmount] = useState('');
  const [currentlyInsured, setCurrentlyInsured] = useState('');
  const [conditionInterest, setConditionInterest] = useState('');
  const [preferredSpecialist, setPreferredSpecialist] = useState('');
  const [appointmentTimeframe, setAppointmentTimeframe] = useState('');
  const [insuranceStatusHealth, setInsuranceStatusHealth] = useState('');
  const [interest, setInterest] = useState('');
  const [budget, setBudget] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bestTimeToCall, setBestTimeToCall] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState('');
  const [comments, setComments] = useState('');
  const [consentTcpa, setConsentTcpa] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/company-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant,
          companySlug,
          sectorSlug,
          companyDisplayName: companyDisplayName || undefined,
          fullName,
          email,
          phone,
          zipCode,
          serviceType: serviceType || undefined,
          transactionType: transactionType || undefined,
          budgetRange: budgetRange || undefined,
          propertyType: propertyType || undefined,
          timeline: timeline || undefined,
          loanPreapproved: loanPreapproved || undefined,
          insuranceType: insuranceType || undefined,
          ageRange: ageRange || undefined,
          coverageAmount: coverageAmount || undefined,
          currentlyInsured: currentlyInsured || undefined,
          conditionInterest: conditionInterest || undefined,
          preferredSpecialist: preferredSpecialist || undefined,
          appointmentTimeframe: appointmentTimeframe || undefined,
          insuranceStatusHealth: insuranceStatusHealth || undefined,
          interest: interest || undefined,
          budget: budget || undefined,
          companyName: companyName || undefined,
          bestTimeToCall: bestTimeToCall || undefined,
          preferredContactMethod: preferredContactMethod || undefined,
          comments: comments || undefined,
          consentTcpa,
        }),
      });
      if (!res.ok) {
        setStatus('err');
        return;
      }
      setStatus('ok');
      setFullName('');
      setEmail('');
      setPhone('');
      setZipCode('');
      setServiceType('');
      setTransactionType('');
      setBudgetRange('');
      setPropertyType('');
      setTimeline('');
      setLoanPreapproved('');
      setInsuranceType('');
      setAgeRange('');
      setCoverageAmount('');
      setCurrentlyInsured('');
      setConditionInterest('');
      setPreferredSpecialist('');
      setAppointmentTimeframe('');
      setInsuranceStatusHealth('');
      setInterest('');
      setBudget('');
      setCompanyName('');
      setBestTimeToCall('');
      setPreferredContactMethod('');
      setComments('');
      setConsentTcpa(false);
    } catch {
      setStatus('err');
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="lead-fullName" className={labelClass}>
            {t('fieldFullName')} <span className="text-red-600">*</span>
          </label>
          <input
            id="lead-fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="lead-email" className={labelClass}>
            {t('fieldEmail')} <span className="text-red-600">*</span>
          </label>
          <input
            id="lead-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="lead-phone" className={labelClass}>
            {variant === 'digital' ? t('fieldPhoneOptional') : t('fieldPhone')}{' '}
            {variant !== 'digital' ? <span className="text-red-600">*</span> : null}
          </label>
          <input
            id="lead-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required={variant !== 'digital'}
            autoComplete="tel"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="lead-zip" className={labelClass}>
            {variant === 'real_estate' ? t('fieldZipCity') : t('fieldZip')}{' '}
            <span className="text-red-600">*</span>
          </label>
          <input
            id="lead-zip"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            required
            autoComplete="postal-code"
            className={inputClass}
          />
        </div>
      </div>

      {variant === 'general' ? (
        <LeadFormSelect
          id="lead-service"
          label={t('fieldServiceType')}
          value={serviceType}
          onChange={setServiceType}
          required
          placeholder={t('selectPlaceholder')}
        >
          <option value={t('genOptEcommerce')}>{t('genOptEcommerce')}</option>
          <option value={t('genOptLogistics')}>{t('genOptLogistics')}</option>
          <option value={t('genOptB2b')}>{t('genOptB2b')}</option>
          <option value={t('genOptConsulting')}>{t('genOptConsulting')}</option>
          <option value={t('genOptOther')}>{t('genOptOther')}</option>
        </LeadFormSelect>
      ) : null}

      {variant === 'real_estate' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <LeadFormSelect
            id="lead-tx"
            label={t('fieldTransactionType')}
            value={transactionType}
            onChange={setTransactionType}
            required
            placeholder={t('selectPlaceholder')}
          >
            <option value={t('reOptBuy')}>{t('reOptBuy')}</option>
            <option value={t('reOptSell')}>{t('reOptSell')}</option>
            <option value={t('reOptRent')}>{t('reOptRent')}</option>
          </LeadFormSelect>
          <LeadFormSelect
            id="lead-budget-re"
            label={t('fieldBudgetRange')}
            value={budgetRange}
            onChange={setBudgetRange}
            required
            placeholder={t('selectPlaceholder')}
          >
            <option value={t('reBudget1')}>{t('reBudget1')}</option>
            <option value={t('reBudget2')}>{t('reBudget2')}</option>
            <option value={t('reBudget3')}>{t('reBudget3')}</option>
            <option value={t('reBudget4')}>{t('reBudget4')}</option>
          </LeadFormSelect>
          <LeadFormSelect
            id="lead-prop"
            label={t('fieldPropertyType')}
            value={propertyType}
            onChange={setPropertyType}
            required
          >
            <option value={t('rePropHouse')}>{t('rePropHouse')}</option>
            <option value={t('rePropApt')}>{t('rePropApt')}</option>
            <option value={t('rePropLand')}>{t('rePropLand')}</option>
            <option value={t('rePropCommercial')}>{t('rePropCommercial')}</option>
          </LeadFormSelect>
          <LeadFormSelect
            id="lead-time"
            label={t('fieldTimeline')}
            value={timeline}
            onChange={setTimeline}
            required
            placeholder={t('selectPlaceholder')}
          >
            <option value={t('reTimeImmediate')}>{t('reTimeImmediate')}</option>
            <option value={t('reTime13')}>{t('reTime13')}</option>
            <option value={t('reTime6')}>{t('reTime6')}</option>
          </LeadFormSelect>
          <LeadFormSelect
            id="lead-loan"
            label={t('fieldLoanPreapproved')}
            value={loanPreapproved}
            onChange={setLoanPreapproved}
            required
            placeholder={t('selectPlaceholder')}
          >
            <option value={t('yes')}>{t('yes')}</option>
            <option value={t('no')}>{t('no')}</option>
          </LeadFormSelect>
        </div>
      ) : null}

      {variant === 'insurance' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <LeadFormSelect
            id="lead-ins-type"
            label={t('fieldInsuranceType')}
            value={insuranceType}
            onChange={setInsuranceType}
            required
          >
            <option value={t('insOptHealth')}>{t('insOptHealth')}</option>
            <option value={t('insOptAuto')}>{t('insOptAuto')}</option>
            <option value={t('insOptLife')}>{t('insOptLife')}</option>
            <option value={t('insOptHome')}>{t('insOptHome')}</option>
          </LeadFormSelect>
          <LeadFormSelect
            id="lead-age"
            label={t('fieldAgeRange')}
            value={ageRange}
            onChange={setAgeRange}
            required
            placeholder={t('selectPlaceholder')}
          >
            <option value={t('age18_30')}>{t('age18_30')}</option>
            <option value={t('age31_45')}>{t('age31_45')}</option>
            <option value={t('age46_60')}>{t('age46_60')}</option>
            <option value={t('age60p')}>{t('age60p')}</option>
          </LeadFormSelect>
          <div className="sm:col-span-2">
            <label htmlFor="lead-cov" className={labelClass}>
              {t('fieldCoverageAmount')} <span className="text-red-600">*</span>
            </label>
            <input
              id="lead-cov"
              value={coverageAmount}
              onChange={(e) => setCoverageAmount(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <LeadFormSelect
            id="lead-curr-ins"
            label={t('fieldCurrentlyInsured')}
            value={currentlyInsured}
            onChange={setCurrentlyInsured}
            required
          >
            <option value={t('yes')}>{t('yes')}</option>
            <option value={t('no')}>{t('no')}</option>
          </LeadFormSelect>
        </div>
      ) : null}

      {variant === 'health' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="lead-cond" className={labelClass}>
              {t('fieldConditionInterest')} <span className="text-red-600">*</span>
            </label>
            <input
              id="lead-cond"
              value={conditionInterest}
              onChange={(e) => setConditionInterest(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="lead-spec" className={labelClass}>
              {t('fieldPreferredSpecialist')}
            </label>
            <input
              id="lead-spec"
              value={preferredSpecialist}
              onChange={(e) => setPreferredSpecialist(e.target.value)}
              className={inputClass}
            />
          </div>
          <LeadFormSelect
            id="lead-appt"
            label={t('fieldAppointmentTimeframe')}
            value={appointmentTimeframe}
            onChange={setAppointmentTimeframe}
            required
            placeholder={t('selectPlaceholder')}
          >
            <option value={t('apptAsap')}>{t('apptAsap')}</option>
            <option value={t('apptWeeks')}>{t('apptWeeks')}</option>
            <option value={t('apptPlanning')}>{t('apptPlanning')}</option>
          </LeadFormSelect>
          <LeadFormSelect
            id="lead-h-ins"
            label={t('fieldInsuranceStatus')}
            value={insuranceStatusHealth}
            onChange={setInsuranceStatusHealth}
            required
          >
            <option value={t('healthInsured')}>{t('healthInsured')}</option>
            <option value={t('healthUninsured')}>{t('healthUninsured')}</option>
            <option value={t('healthMedicare')}>{t('healthMedicare')}</option>
          </LeadFormSelect>
        </div>
      ) : null}

      {variant === 'digital' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="lead-int" className={labelClass}>
              {t('fieldInterest')} <span className="text-red-600">*</span>
            </label>
            <input
              id="lead-int"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lead-budget" className={labelClass}>
              {t('fieldBudget')} <span className="text-red-600">*</span>
            </label>
            <input
              id="lead-budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lead-co" className={labelClass}>
              {t('fieldCompanyName')}
            </label>
            <input
              id="lead-co"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      ) : null}

      <details className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">{t('advancedToggle')}</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lead-btc" className={labelClass}>
              {t('fieldBestTimeToCall')}
            </label>
            <input id="lead-btc" value={bestTimeToCall} onChange={(e) => setBestTimeToCall(e.target.value)} className={inputClass} />
          </div>
          <LeadFormSelect
            id="lead-pref"
            label={t('fieldPreferredContact')}
            value={preferredContactMethod}
            onChange={setPreferredContactMethod}
            placeholder={t('selectPlaceholder')}
          >
            <option value={t('contactMethodCall')}>{t('contactMethodCall')}</option>
            <option value={t('contactMethodEmail')}>{t('contactMethodEmail')}</option>
            <option value={t('contactMethodWhatsapp')}>{t('contactMethodWhatsapp')}</option>
          </LeadFormSelect>
          <div className="sm:col-span-2">
            <label htmlFor="lead-notes" className={labelClass}>
              {t('fieldComments')}
            </label>
            <textarea
              id="lead-notes"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </details>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={consentTcpa}
          onChange={(e) => setConsentTcpa(e.target.checked)}
          required
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-900"
        />
        <span>{t('fieldConsent')}</span>
      </label>

      <p className="text-xs text-slate-500">
        {t('trustLine')}{' '}
        <Link href="/privacy-policy" className="font-semibold text-blue-900 underline">
          {t('privacyLinkText')}
        </Link>
      </p>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full rounded-lg bg-blue-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
      >
        {status === 'sending' ? t('submitting') : t('submitLead')}
      </button>

      {status === 'ok' ? <p className="text-sm font-medium text-emerald-700">{t('leadSuccess')}</p> : null}
      {status === 'err' ? <p className="text-sm font-medium text-red-600">{t('leadError')}</p> : null}
    </form>
  );
}
