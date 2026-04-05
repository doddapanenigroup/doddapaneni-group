'use client';

import { Mail, Phone, MapPin, Send, CheckCircle2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

/** E.164 for tel: — keep in sync with displayed numbers in locale messages */
const PHONE_HREF = { india: 'tel:+918142246666', usa: 'tel:+13522308586' } as const;

/** Canonical inbox; used if a locale leaves `ContactPage.emailAddress` empty */
const CONTACT_EMAIL_FALLBACK = 'info@doddapanenigroup.net';

export default function ContactPageClient() {
  const t = useTranslations('ContactPage');
  const [showSuccess, setShowSuccess] = useState(false);
  const contactEmail = t('emailAddress').trim() || CONTACT_EMAIL_FALLBACK;

  const contactSchema = z.object({
    name: z.string().min(1, t('nameRequired')),
    email: z.string().min(1, t('emailRequired')).email(t('emailInvalid')),
    message: z.string().min(1, t('messageRequired')).min(10, t('messageMinLength')),
  });

  type ContactFormValues = z.infer<typeof contactSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        reset();
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const inputBase =
    'block w-full rounded-lg border bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 transition-shadow focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/30';

  return (
      <MotionLazy>
      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-b from-blue-950 to-blue-900 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300 sm:text-xs">
              Doddapaneni Group
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
              {t('headerTitle')}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base md:text-lg">
              {t('headerSubtitle')}
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-left text-xs leading-relaxed text-blue-200/95 sm:text-sm md:text-center">
              {t('headerIntro')}
            </p>
          </div>
        </section>

        <section className="border-t border-blue-100/80 bg-slate-50 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
              >
                <span className="mb-4 inline-block h-0.5 w-12 rounded-full bg-blue-800" />
                <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{t('getInTouch')}</h2>
                <div className="space-y-4">
                  <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                        <Mail className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('emailTitle')}</h3>
                        <a
                          href={`mailto:${contactEmail}`}
                          className="mt-1 inline-flex items-center gap-1 break-all text-base font-semibold text-blue-900 underline-offset-2 hover:text-blue-700 hover:underline"
                        >
                          {contactEmail}
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                        </a>
                        <p className="mt-2 text-xs text-slate-500 sm:text-sm">{t('emailResponse')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                        <Phone className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('phoneTitle')}</h3>
                        <div className="mt-2 space-y-1.5 text-sm sm:text-base">
                          <p>
                            <span className="font-medium text-slate-700">{t('phoneIndiaLabel')}: </span>
                            <a href={PHONE_HREF.india} className="font-semibold text-blue-900 hover:underline">
                              {t('phoneIndia')}
                            </a>
                          </p>
                          <p>
                            <span className="font-medium text-slate-700">{t('phoneUSALabel')}: </span>
                            <a href={PHONE_HREF.usa} className="font-semibold text-blue-900 hover:underline">
                              {t('phoneUSA')}
                            </a>
                          </p>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 sm:text-sm">{t('phoneAvailability')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
                        <MapPin className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('locationsTitle')}</h3>
                        <div className="mt-3 space-y-4 text-sm leading-relaxed text-slate-700">
                          <div>
                            <p className="font-semibold text-slate-900">{t('locationIndia')}</p>
                            <p className="mt-1 text-slate-600">{t('addressIndia')}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{t('locationUSA')}</p>
                            <p className="mt-1 text-slate-600">{t('addressUSA')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.06 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md md:p-8"
              >
                <h2 className="text-xl font-bold text-slate-900">{t('formTitle')}</h2>
                <p className="mt-1 text-sm text-slate-600">{t('formSubtitle')}</p>

                {showSuccess ? (
                  <m.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 flex flex-col items-center rounded-xl border border-blue-200 bg-blue-50/80 p-8 text-center text-blue-950"
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <CheckCircle2 className="h-6 w-6 text-blue-800" strokeWidth={1.75} aria-hidden />
                    </div>
                    <h3 className="text-lg font-bold">{t('successTitle')}</h3>
                    <p className="mt-2 text-sm font-medium">{t('successMessage')}</p>
                  </m.div>
                ) : (
                  <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div>
                      <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        {t('formName')}
                      </label>
                      <input
                        type="text"
                        id="contact-name"
                        autoComplete="name"
                        {...register('name')}
                        className={`${inputBase} ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
                        placeholder={t('formNamePlaceholder')}
                      />
                      {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        {t('formEmail')}
                      </label>
                      <input
                        type="email"
                        id="contact-email"
                        autoComplete="email"
                        {...register('email')}
                        className={`${inputBase} ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
                        placeholder={t('formEmailPlaceholder')}
                      />
                      {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
                    </div>
                    <div>
                      <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        {t('formMessage')}
                      </label>
                      <textarea
                        id="contact-message"
                        rows={5}
                        {...register('message')}
                        className={`${inputBase} resize-none ${errors.message ? 'border-red-400' : 'border-slate-200'}`}
                        placeholder={t('formMessagePlaceholder')}
                      />
                      {errors.message ? <p className="mt-1 text-xs text-red-600">{errors.message.message}</p> : null}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <Send className="h-4 w-4 animate-pulse" strokeWidth={1.75} aria-hidden />
                          {t('sendingButton')}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                          {t('sendButton')}
                        </>
                      )}
                    </button>
                  </form>
                )}
              </m.div>
            </div>
          </div>
        </section>
      </div>
      </MotionLazy>
  );
}
