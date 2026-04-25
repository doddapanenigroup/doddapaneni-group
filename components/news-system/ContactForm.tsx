'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { NewsSector } from '@/lib/doddapaneni-news';

type Props = {
  sector: NewsSector;
  articleTitle: string;
  articleSlug: string;
  articlePath: string;
};

type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(6, 'Phone is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20';

export default function ContactForm({ sector, articleTitle, articleSlug, articlePath }: Props) {
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  const onSubmit = handleSubmit(async (form) => {
    setSuccess(false);
    setEmailSent(true);
    const response = await fetch('/api/public/doddapaneni-news-forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'contact',
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
      reset();
      return;
    }
    alert('Could not submit your message. Please try again.');
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-bold text-slate-900">Contact Us</h3>
      <p className="mt-1 text-sm text-slate-600">Have questions? Send us a message.</p>

      {success ? (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${
            emailSent ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-950'
          }`}
        >
          {emailSent
            ? 'Thank you. We will get back to you soon.'
            : 'Your message was received, but email could not be sent from this server. Our team can still see your submission—please reach out via the main contact page if you need a reply urgently.'}
        </p>
      ) : null}

      <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
          <input className={inputClass} {...register('name')} autoComplete="name" />
          {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
          <input type="email" className={inputClass} {...register('email')} autoComplete="email" />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</label>
          <input className={inputClass} {...register('phone')} autoComplete="tel" />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Message</label>
          <textarea className={`${inputClass} min-h-[130px]`} {...register('message')} />
          {errors.message ? <p className="mt-1 text-xs text-red-600">{errors.message.message}</p> : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg border-2 border-blue-900 bg-white px-4 py-2 text-sm font-semibold text-blue-900 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {isSubmitting ? 'Sending...' : 'Contact Us'}
        </button>
      </form>
    </div>
  );
}
