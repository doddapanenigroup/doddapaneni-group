'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { LeadDynamicField, NewsSector } from '@/lib/doddapaneni-news';

type Props = {
  sector: NewsSector;
  articleTitle: string;
  articleSlug: string;
  articlePath: string;
};

type LeadFormValues = {
  fullName: string;
  email: string;
  phone: string;
  zipCode: string;
  serviceType: string;
  dynamic: Record<string, string>;
  bestTimeToCall: string;
  preferredContactMethod: string;
  consentUsLead: boolean;
  notes: string;
};

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20';

function isUsZip(zipCode: string): boolean {
  return /^\d{5}(?:-\d{4})?$/.test(zipCode.trim());
}

function schemaForSector(sector: NewsSector) {
  return z
    .object({
      fullName: z.string().min(1, 'Full name is required'),
      email: z.string().email('Valid email is required'),
      phone: z.string().min(6, 'Phone number is required'),
      zipCode: z.string().min(2, 'Zip code is required'),
      serviceType: z.string().min(1, 'Service type is required'),
      dynamic: z.record(z.string(), z.string()),
      bestTimeToCall: z.string().min(1, 'Best time to call is required'),
      preferredContactMethod: z.string().min(1, 'Preferred contact method is required'),
      consentUsLead: z.boolean(),
      notes: z.string().max(4000),
    })
    .superRefine((value, ctx) => {
      for (const field of sector.dynamicFields) {
        const fieldVal = (value.dynamic[field.id] ?? '').trim();
        if (field.required && !fieldVal) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field.label} is required`,
            path: ['dynamic', field.id],
          });
        }
      }
      if (isUsZip(value.zipCode) && !value.consentUsLead) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Consent is required for USA leads',
          path: ['consentUsLead'],
        });
      }
    });
}

function DynamicField({ field }: { field: LeadDynamicField }) {
  return <span className="hidden" data-field-id={field.id} />;
}

export default function LeadForm({ sector, articleTitle, articleSlug, articlePath }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const schema = useMemo(() => schemaForSector(sector), [sector]);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      zipCode: '',
      serviceType: sector.serviceTypeOptions[0] ?? '',
      dynamic: {},
      bestTimeToCall: '',
      preferredContactMethod: '',
      consentUsLead: false,
      notes: '',
    },
  });

  const zip = watch('zipCode');
  const showConsent = isUsZip(zip ?? '');

  const moveToStepTwo = async () => {
    const ok = await trigger(['fullName', 'email', 'phone', 'zipCode', 'serviceType']);
    if (ok) setStep(2);
  };

  const onSubmit = handleSubmit(async (form) => {
    setSuccess(false);
    setEmailSent(true);
    const response = await fetch('/api/public/doddapaneni-news-forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'lead',
        sectorSlug: sector.slug,
        sectorName: sector.name,
        articleTitle,
        articleSlug,
        articlePath,
        ...form,
      }),
    });

    const json = (await response.json().catch(() => ({}))) as { emailSent?: boolean };
    if (response.ok) {
      setEmailSent(json.emailSent !== false);
      setSuccess(true);
      setStep(1);
      reset();
      return;
    }
    alert('Could not submit your request. Please try again.');
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-bold text-slate-900">Lead Generation</h3>
      <p className="mt-1 text-sm text-slate-600">Step {step} of 2</p>

      {success ? (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${
            emailSent ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-950'
          }`}
        >
          {emailSent
            ? 'Thank you. Our team will contact you shortly.'
            : 'Your details were received, but email could not be sent from this server. Our team can still review your submission—use the main site contact if you need a quick follow-up.'}
        </p>
      ) : null}

      <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
        {step === 1 ? (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</label>
              <input className={inputClass} {...register('fullName')} autoComplete="name" />
              {errors.fullName ? <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email Address</label>
              <input type="email" className={inputClass} {...register('email')} autoComplete="email" />
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone Number</label>
              <input className={inputClass} {...register('phone')} autoComplete="tel" />
              {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Zip Code</label>
                <input className={inputClass} {...register('zipCode')} autoComplete="postal-code" />
                {errors.zipCode ? <p className="mt-1 text-xs text-red-600">{errors.zipCode.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Service Type</label>
                <select className={inputClass} {...register('serviceType')}>
                  <option value="">Select service</option>
                  {sector.serviceTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {errors.serviceType ? <p className="mt-1 text-xs text-red-600">{errors.serviceType.message}</p> : null}
              </div>
            </div>
          </>
        ) : (
          <>
            {sector.dynamicFields.map((field) => (
              <div key={field.id}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</label>
                <DynamicField field={field} />
                {field.type === 'select' ? (
                  <select className={inputClass} {...register(`dynamic.${field.id}`)}>
                    <option value="">Select option</option>
                    {(field.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea className={`${inputClass} min-h-[110px]`} {...register(`dynamic.${field.id}`)} />
                ) : (
                  <input className={inputClass} placeholder={field.placeholder} {...register(`dynamic.${field.id}`)} />
                )}
                {errors.dynamic?.[field.id] ? (
                  <p className="mt-1 text-xs text-red-600">{errors.dynamic[field.id]?.message}</p>
                ) : null}
              </div>
            ))}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Best Time to Call</label>
              <select className={inputClass} {...register('bestTimeToCall')}>
                <option value="">Select preferred window</option>
                <option value="morning">Morning (9am - 12pm)</option>
                <option value="afternoon">Afternoon (12pm - 4pm)</option>
                <option value="evening">Evening (4pm - 8pm)</option>
              </select>
              {errors.bestTimeToCall ? <p className="mt-1 text-xs text-red-600">{errors.bestTimeToCall.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Preferred Contact Method
              </label>
              <select className={inputClass} {...register('preferredContactMethod')}>
                <option value="">Select method</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
              {errors.preferredContactMethod ? (
                <p className="mt-1 text-xs text-red-600">{errors.preferredContactMethod.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</label>
              <textarea className={`${inputClass} min-h-[90px]`} {...register('notes')} />
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" className="mt-0.5" {...register('consentUsLead')} />
              <span>
                I consent to being contacted for consultation purposes.
                {showConsent ? ' (Required for USA leads)' : ''}
              </span>
            </label>
            {errors.consentUsLead ? <p className="text-xs text-red-600">{errors.consentUsLead.message}</p> : null}
          </>
        )}

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </button>
          ) : null}
          {step === 1 ? (
            <button
              type="button"
              onClick={moveToStepTwo}
              className="inline-flex items-center justify-center rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-950"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Get Free Consultation'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
