'use client';

import { m } from 'framer-motion';
import MotionLazy from '@/components/motion/MotionLazy';

type Props = {
  heading: string;
  paragraphs: string[];
  pageKey: string;
  cmsKeyHint: string;
  cmsKeyNote: string;
  /** True when rendered under `CompanyDivisionShell` (nav offset handled there). */
  embeddedInDivisionShell?: boolean;
};

export default function CompanyDivisionSubPageContent({
  heading,
  paragraphs,
  pageKey,
  cmsKeyHint,
  cmsKeyNote,
  embeddedInDivisionShell = false,
}: Props) {
  const heroVertical =
    embeddedInDivisionShell === true
      ? 'pt-8 pb-8 sm:pt-10 sm:pb-10'
      : 'pt-24 pb-8 sm:pt-28 sm:pb-10';

  return (
    <MotionLazy>
      <section className={`bg-blue-900 px-4 sm:px-6 lg:px-8 ${heroVertical}`}>
        <div className="mx-auto max-w-3xl text-center">
          <m.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl"
          >
            {heading}
          </m.h1>
        </div>
      </section>
      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-4">
          {paragraphs.map((text, i) => (
            <m.p
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-sm leading-relaxed text-slate-700 sm:text-base"
            >
              {text}
            </m.p>
          ))}
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            {cmsKeyHint} <span className="font-mono text-slate-700">{pageKey}</span>
            <span className="mt-2 block text-slate-500">{cmsKeyNote}</span>
          </p>
        </div>
      </section>
    </MotionLazy>
  );
}
