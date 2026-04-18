'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import type { ComponentProps } from 'react';
import { useTranslations } from '@/lib/dictionary-react';

const FOUNDER_IMAGE = '/founder.png';

/** Deters casual save/drag on images; cannot block OS screenshots or screen recording (browser limitation). */
const TEAM_IMG_CLASS = 'select-none [-webkit-user-drag:none] [-webkit-touch-callout:none]';

const DEVELOPERS = [
  { id: 'lokesh', image: '/lokesh.jpeg' },
  { id: 'nikitha', image: '/nikitha.jpeg' },
  { id: 'richa', image: '/richa.jpeg' },
  { id: 'snigdha', image: '/snigdha.jpeg' },
] as const;

const MARKETERS = [
  { id: 'rajitha', image: '/rajitha.jpeg' },
  { id: 'vijay', image: '/vijay.jpeg' },
] as const;

function blockImageDragStart(e: React.DragEvent) {
  if (e.target instanceof HTMLImageElement) e.preventDefault();
}

function TeamImage(props: ComponentProps<typeof Image>) {
  const { className, onContextMenu, ...rest } = props;
  return (
    <Image
      {...rest}
      draggable={false}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e);
      }}
      onDragStart={blockImageDragStart}
      className={[TEAM_IMG_CLASS, className].filter(Boolean).join(' ')}
    />
  );
}

function MemberCard({
  memberId,
  imageSrc,
  t,
}: {
  memberId: string;
  imageSrc: string;
  t: (key: string) => string;
}) {
  const name = t(`${memberId}.name`);
  const role = t(`${memberId}.role`);
  const bio = t(`${memberId}.bio`);
  const alt = t(`${memberId}.imageAlt`);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        <TeamImage
          src={imageSrc}
          alt={alt}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <h3 className="text-lg font-bold text-slate-900 md:text-xl">{name}</h3>
        <p className="mt-1 text-sm font-semibold text-blue-800">{role}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">{bio}</p>
      </div>
    </article>
  );
}

export default function TeamPageClient() {
  const t = useTranslations('TeamPage');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 's') e.preventDefault();
      if (key === 'printscreen') e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  return (
    <div
      className="min-h-screen bg-white pt-20"
      onContextMenu={(e) => {
        if (e.target instanceof HTMLImageElement) e.preventDefault();
      }}
      onDragStartCapture={(e) => {
        if (e.target instanceof HTMLImageElement) e.preventDefault();
      }}
    >
      <section className="border-b border-slate-200 bg-slate-50 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            {t('heroTitle')}
          </h1>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-10 lg:gap-12">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md ring-2 ring-slate-200/90 sm:h-32 sm:w-32 md:h-36 md:w-36">
              <TeamImage
                src={FOUNDER_IMAGE}
                alt={t('founder.imageAlt')}
                fill
                className="object-cover object-top"
                sizes="144px"
                priority
              />
            </div>
            <div className="min-w-0 flex-1 text-center md:text-left">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">{t('founder.role')}</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">{t('founder.name')}</h2>
              <p className="mt-6 text-slate-600 leading-relaxed md:text-lg">{t('founder.bio1')}</p>
              <p className="mt-4 text-slate-600 leading-relaxed md:text-lg">{t('founder.bio2')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/80 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{t('developersTitle')}</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {DEVELOPERS.map(({ id, image }) => (
              <MemberCard key={id} memberId={id} imageSrc={image} t={t} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{t('marketersTitle')}</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {MARKETERS.map(({ id, image }) => (
              <MemberCard key={id} memberId={id} imageSrc={image} t={t} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
