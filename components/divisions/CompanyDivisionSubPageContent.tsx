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
      ? 'pt-3 pb-3 sm:pt-4 sm:pb-4'
      : 'pt-16 pb-5 sm:pt-16 sm:pb-6 md:pt-20 md:pb-7';

  return (
    <MotionLazy>
      <section
        className={`border-b border-blue-950/20 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-4 sm:px-6 lg:px-8 ${heroVertical}`}
      >
        <div className="mx-auto max-w-4xl text-center">
          <m.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={
              embeddedInDivisionShell
                ? 'font-serif text-base font-bold tracking-tight text-white sm:text-lg md:text-xl'
                : 'font-serif text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl'
            }
          >
            {heading}
          </m.h1>
        </div>
      </section>
      <section
        className={
          embeddedInDivisionShell
            ? 'border-b border-slate-100 bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8'
            : 'border-b border-slate-100 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8'
        }
      >
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
