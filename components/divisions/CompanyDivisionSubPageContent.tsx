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
      <section
        className={`border-b border-blue-950/20 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-4 sm:px-6 lg:px-8 ${heroVertical}`}
      >
        <div className="mx-auto max-w-4xl text-center">
          <m.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-[2rem]"
          >
            {heading}
          </m.h1>
        </div>
      </section>
      <section className="border-b border-slate-100 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-5">
          {paragraphs.map((text, i) => (
            <m.p
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-[15px] leading-[1.7] text-slate-700 sm:text-base"
            >
              {text}
            </m.p>
          ))}
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 px-4 py-3.5 text-xs leading-relaxed text-slate-500">
            {cmsKeyHint} <span className="font-mono text-slate-700">{pageKey}</span>
            <span className="mt-2 block text-slate-500">{cmsKeyNote}</span>
          </p>
        </div>
      </section>
    </MotionLazy>
  );
}
