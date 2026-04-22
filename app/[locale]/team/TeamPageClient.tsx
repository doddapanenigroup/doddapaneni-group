'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import type { ComponentProps, CSSProperties } from 'react';
import { useTranslations } from '@/lib/dictionary-react';
import type { TeamMemberPublic } from '@/lib/team-members-shared';

const TEAM_IMG_CLASS = 'select-none [-webkit-user-drag:none] [-webkit-touch-callout:none]';

function blockImageDragStart(e: React.DragEvent) {
  if (e.target instanceof HTMLImageElement) e.preventDefault();
}

function TeamImage(props: ComponentProps<typeof Image>) {
  const { className, onContextMenu, style, ...rest } = props;
  return (
    <Image
      {...rest}
      draggable={false}
      style={style}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e);
      }}
      onDragStart={blockImageDragStart}
      className={[TEAM_IMG_CLASS, className].filter(Boolean).join(' ')}
    />
  );
}

function memberImageStyle(m: TeamMemberPublic): CSSProperties {
  return {
    transform: `translate(${m.imageOffsetX}%, ${m.imageOffsetY}%) scale(${m.imageScale})`,
    transformOrigin: 'center center',
  };
}

function MemberCard({ member }: { member: TeamMemberPublic }) {
  const alt = member.imageAlt?.trim() || member.name;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-slate-300 bg-white text-center shadow-sm transition-shadow hover:border-slate-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-950 dark:hover:border-slate-500">
      <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-800">
        <TeamImage
          src={member.imageUrl}
          alt={alt}
          fill
          className="object-cover"
          style={memberImageStyle(member)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
        />
      </div>
      <div className="flex flex-1 flex-col border-t border-slate-200 px-5 py-5 md:px-6 md:py-6 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 md:text-xl dark:text-slate-100">{member.name}</h3>
        <p className="mt-1 text-sm font-semibold text-blue-800 dark:text-blue-300">{member.designation}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base dark:text-slate-400">{member.description}</p>
      </div>
    </article>
  );
}

type Props = {
  team: {
    founder: TeamMemberPublic | null;
    developers: TeamMemberPublic[];
    marketers: TeamMemberPublic[];
  };
};

export default function TeamPageClient({ team }: Props) {
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

  const { founder, developers, marketers } = team;

  return (
    <div
      className="min-h-screen bg-white"
      onContextMenu={(e) => {
        if (e.target instanceof HTMLImageElement) e.preventDefault();
      }}
      onDragStartCapture={(e) => {
        if (e.target instanceof HTMLImageElement) e.preventDefault();
      }}
    >
      <section className="border-b border-blue-950/50 bg-blue-900 px-4 pt-24 pb-10 sm:px-6 sm:pt-28 sm:pb-14 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl md:text-4xl">
            {t('heroTitle')}
          </h1>
        </div>
      </section>

      <section className="border-t border-blue-100/80 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {founder ? (
            <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-10 lg:gap-12">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md ring-2 ring-slate-200/90 sm:h-32 sm:w-32 md:h-36 md:w-36">
                <TeamImage
                  src={founder.imageUrl}
                  alt={founder.imageAlt?.trim() || founder.name}
                  fill
                  className="object-cover"
                  style={memberImageStyle(founder)}
                  sizes="144px"
                  priority
                />
              </div>
              <div className="min-w-0 flex-1 text-center md:text-left">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">{founder.designation}</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">{founder.name}</h2>
                <p className="mt-6 text-slate-600 leading-relaxed md:text-lg">{founder.description}</p>
                {founder.descriptionExtra?.trim() ? (
                  <p className="mt-4 text-slate-600 leading-relaxed md:text-lg">{founder.descriptionExtra}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-500">Founder profile will appear here once added in the admin team settings.</p>
          )}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/80 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{t('developersTitle')}</h2>
          {developers.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {developers.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-slate-500">No developers listed yet.</p>
          )}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{t('marketersTitle')}</h2>
          {marketers.length > 0 ? (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              {marketers.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-slate-500">No digital marketers listed yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
