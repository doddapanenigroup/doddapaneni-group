'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';

const inputClass =
  'block w-full rounded-xl border-2 border-blue-100 bg-white px-3 py-2.5 text-sm font-medium text-blue-950 shadow-sm placeholder:text-blue-900/40 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20';

type Props = {
  articleSlug: string;
  articleTitle: string;
  articlePathname: string;
};

export default function NewsPostEngagement({ articleSlug, articleTitle, articlePathname }: Props) {
  const t = useTranslations('Blog');
  const [leadOk, setLeadOk] = useState(false);
  const [commentOk, setCommentOk] = useState(false);

  const leadSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    company: z.string().optional(),
    message: z.string().min(5),
  });

  const commentSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    comment: z.string().min(3).max(8000),
  });

  type LeadVals = z.infer<typeof leadSchema>;
  type CommentVals = z.infer<typeof commentSchema>;

  const leadForm = useForm<LeadVals>({ resolver: zodResolver(leadSchema) });
  const commentForm = useForm<CommentVals>({ resolver: zodResolver(commentSchema) });

  const postLead = leadForm.handleSubmit(async (data) => {
    setLeadOk(false);
    const res = await fetch('/api/public/news-engagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'lead',
        articleSlug,
        articleTitle,
        articlePathname,
        ...data,
      }),
    });
    if (res.ok) {
      setLeadOk(true);
      leadForm.reset();
    } else {
      alert(t('engagementError'));
    }
  });

  const postComment = commentForm.handleSubmit(async (data) => {
    setCommentOk(false);
    const res = await fetch('/api/public/news-engagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'comment',
        articleSlug,
        articleTitle,
        articlePathname,
        name: data.name,
        email: data.email,
        comment: data.comment,
      }),
    });
    if (res.ok) {
      setCommentOk(true);
      commentForm.reset();
    } else {
      alert(t('engagementError'));
    }
  });

  return (
    <section className="border-t-2 border-blue-100 bg-blue-50/40 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-900">
          {t('engagementSectionEyebrow')}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-blue-950 md:text-3xl">
          {t('engagementSectionTitle')}
        </h2>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="rounded-2xl border-2 border-blue-100 bg-white p-6 shadow-[0_2px_12px_rgba(30,58,138,0.06)] md:p-8">
            <h3 className="text-lg font-bold text-blue-950">{t('engagementLeadTitle')}</h3>
            <p className="mt-1 text-sm text-blue-900/75">{t('engagementLeadSubtitle')}</p>
            {leadOk ? (
              <p className="mt-4 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-900">
                {t('engagementSuccessLead')}
              </p>
            ) : null}
            <form className="mt-6 space-y-4" onSubmit={postLead} noValidate>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-blue-900/70">
                  {t('engagementName')}
                </label>
                <input className={inputClass} {...leadForm.register('name')} autoComplete="name" />
                {leadForm.formState.errors.name ? (
                  <p className="mt-1 text-xs text-red-600">{t('engagementRequired')}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-blue-900/70">
                  {t('engagementEmail')}
                </label>
                <input
                  type="email"
                  className={inputClass}
                  {...leadForm.register('email')}
                  autoComplete="email"
                />
                {leadForm.formState.errors.email ? (
                  <p className="mt-1 text-xs text-red-600">{t('engagementRequired')}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-blue-900/70">
                  {t('engagementPhone')}
                </label>
                <input className={inputClass} {...leadForm.register('phone')} autoComplete="tel" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-blue-900/70">
                  {t('engagementCompany')}
                </label>
                <input className={inputClass} {...leadForm.register('company')} autoComplete="organization" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-blue-900/70">
                  {t('engagementInterest')}
                </label>
                <textarea
                  className={`${inputClass} min-h-[120px] resize-y`}
                  {...leadForm.register('message')}
                />
                {leadForm.formState.errors.message ? (
                  <p className="mt-1 text-xs text-red-600">{t('engagementRequired')}</p>
                ) : null}
              </div>
              <p className="text-xs text-blue-900/60">{t('engagementPrivacyNote')}</p>
              <button
                type="submit"
                disabled={leadForm.formState.isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:opacity-60 sm:w-auto"
              >
                <Send className="h-4 w-4" aria-hidden />
                {leadForm.formState.isSubmitting ? t('engagementSending') : t('engagementSubmitLead')}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border-2 border-blue-100 bg-white p-6 shadow-[0_2px_12px_rgba(30,58,138,0.06)] md:p-8">
            <h3 className="text-lg font-bold text-blue-950">{t('engagementCommentTitle')}</h3>
            <p className="mt-1 text-sm text-blue-900/75">{t('engagementCommentSubtitle')}</p>
            {commentOk ? (
              <p className="mt-4 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-900">
                {t('engagementSuccessComment')}
              </p>
            ) : null}
            <form className="mt-6 space-y-4" onSubmit={postComment} noValidate>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-blue-900/70">
                  {t('engagementName')}
                </label>
                <input className={inputClass} {...commentForm.register('name')} autoComplete="name" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-blue-900/70">
                  {t('engagementEmail')}
                </label>
                <input
                  type="email"
                  className={inputClass}
                  {...commentForm.register('email')}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-blue-900/70">
                  {t('engagementCommentLabel')}
                </label>
                <textarea
                  className={`${inputClass} min-h-[160px] resize-y`}
                  {...commentForm.register('comment')}
                />
                {commentForm.formState.errors.comment ? (
                  <p className="mt-1 text-xs text-red-600">{t('engagementRequired')}</p>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={commentForm.formState.isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-900 bg-white px-4 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-50 disabled:opacity-60 sm:w-auto"
              >
                <Send className="h-4 w-4" aria-hidden />
                {commentForm.formState.isSubmitting ? t('engagementSending') : t('engagementSubmitComment')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
