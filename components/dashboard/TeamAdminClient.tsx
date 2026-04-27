'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Pencil, Plus, Trash2, Upload, Users } from 'lucide-react';
import Image from 'next/image';
import type { TeamMemberPublic } from '@/lib/team-members-shared';
import { TEAM_MEMBER_DESCRIPTION_MAX_WORDS, countWords } from '@/lib/team-members-shared';
import { publicPathForLocale } from '@/lib/public-path-with-locale';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import TeamPhotoCropper from '@/components/dashboard/TeamPhotoCropper';
import {
  dashboardHeaderActionPrimary,
  dashboardHeaderActionSecondary,
  dashboardIconButtonClass,
  dashboardInputClass,
  dashboardListFrameClass,
  dashboardModalBackdropClass,
  dashboardModalFrameClass,
  dashboardNestedCardClass,
  dashboardNoticeErrorClass,
  dashboardPanelHeaderClass,
} from '@/lib/dashboard-ui';

type Grouped = {
  founder: TeamMemberPublic | null;
  developers: TeamMemberPublic[];
  marketers: TeamMemberPublic[];
};

const emptyForm = (): Omit<TeamMemberPublic, 'id'> & { id?: string } => ({
  section: 'DEVELOPER',
  sortOrder: 0,
  name: '',
  designation: '',
  description: '',
  descriptionExtra: null,
  imageUrl: '',
  imageAlt: '',
  imageOffsetX: 0,
  imageOffsetY: 0,
  imageScale: 1,
});

export default function TeamAdminClient({ locale, dashboardHref }: { locale: string; dashboardHref: string }) {
  const [data, setData] = useState<Grouped | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [seeding, setSeeding] = useState(false);
  const teamPhotoInputRef = useRef<HTMLInputElement>(null);
  /** Local object URL while user is cropping (not yet uploaded). */
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const totalCount = useMemo(() => {
    if (!data) return 0;
    return (data.founder ? 1 : 0) + data.developers.length + data.marketers.length;
  }, [data]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/team-members');
      const json = (await res.json().catch(() => ({}))) as Grouped & { message?: string };
      if (!res.ok) {
        setError(typeof json.message === 'string' ? json.message : 'Failed to load team');
        setData(null);
        return;
      }
      setData({
        founder: json.founder ?? null,
        developers: json.developers ?? [],
        marketers: json.marketers ?? [],
      });
    } catch {
      setError('Network error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function revokeCropObjectUrl() {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function closeMemberModal() {
    revokeCropObjectUrl();
    setModalOpen(false);
  }

  function openCreate() {
    revokeCropObjectUrl();
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(m: TeamMemberPublic) {
    revokeCropObjectUrl();
    setForm({
      id: m.id,
      section: m.section,
      sortOrder: m.sortOrder,
      name: m.name,
      designation: m.designation,
      description: m.description,
      descriptionExtra: m.descriptionExtra,
      imageUrl: m.imageUrl,
      imageAlt: m.imageAlt ?? '',
      imageOffsetX: m.imageOffsetX,
      imageOffsetY: m.imageOffsetY,
      imageScale: m.imageScale,
    });
    setModalOpen(true);
  }

  function onLocalPhotoFileChosen(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return;
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setError(null);
  }

  async function uploadCroppedTeamPhoto(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (form.name.trim()) fd.append('altText', form.name.trim());
      const res = await fetch('/api/marketer/stored-image', { method: 'POST', body: fd });
      const json = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
      if (!res.ok) {
        setError(typeof json.message === 'string' ? json.message : 'Upload failed');
        return;
      }
      if (json.url) {
        setForm((f) => ({
          ...f,
          imageUrl: json.url as string,
          imageOffsetX: 0,
          imageOffsetY: 0,
          imageScale: 1,
        }));
        revokeCropObjectUrl();
      }
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function saveModal() {
    if (!form.name.trim() || !form.designation.trim() || !form.description.trim() || !form.imageUrl.trim()) {
      setError('Name, designation, description, and image are required.');
      return;
    }
    const wc = countWords(form.description);
    if (wc > TEAM_MEMBER_DESCRIPTION_MAX_WORDS) {
      setError(`Description must be at most ${TEAM_MEMBER_DESCRIPTION_MAX_WORDS} words.`);
      return;
    }
    if (form.descriptionExtra?.trim()) {
      const w2 = countWords(form.descriptionExtra);
      if (w2 > TEAM_MEMBER_DESCRIPTION_MAX_WORDS) {
        setError(`Second paragraph must be at most ${TEAM_MEMBER_DESCRIPTION_MAX_WORDS} words.`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        section: form.section,
        sortOrder: form.sortOrder,
        name: form.name.trim(),
        designation: form.designation.trim(),
        description: form.description.trim(),
        descriptionExtra: form.section === 'FOUNDER' && form.descriptionExtra?.trim() ? form.descriptionExtra.trim() : null,
        imageUrl: form.imageUrl.trim(),
        imageAlt: form.imageAlt?.trim() || null,
        imageOffsetX: form.imageOffsetX,
        imageOffsetY: form.imageOffsetY,
        imageScale: form.imageScale,
      };

      if (form.id) {
        const res = await fetch(`/api/admin/team-members/${encodeURIComponent(form.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) {
          setError(typeof json.message === 'string' ? json.message : 'Save failed');
          return;
        }
      } else {
        const res = await fetch('/api/admin/team-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) {
          setError(typeof json.message === 'string' ? json.message : 'Create failed');
          return;
        }
      }
      closeMemberModal();
      await load();
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(id: string) {
    if (!confirm('Remove this team member from the public team page?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/team-members/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        setError(typeof json.message === 'string' ? json.message : 'Delete failed');
        return;
      }
      await load();
    } catch {
      setError('Delete failed');
    }
  }

  async function importDefaults() {
    if (!confirm('Import the built-in roster? This only works when the team table is empty.')) return;
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/team-members/seed', { method: 'POST' });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(typeof json.message === 'string' ? json.message : 'Import failed');
        return;
      }
      await load();
    } catch {
      setError('Import failed');
    } finally {
      setSeeding(false);
    }
  }

  function previewStyle(): CSSProperties | undefined {
    if (form.imageOffsetX === 0 && form.imageOffsetY === 0 && form.imageScale === 1) return undefined;
    return {
      transform: `translate(${form.imageOffsetX}%, ${form.imageOffsetY}%) scale(${form.imageScale})`,
      transformOrigin: 'center center',
    };
  }

  const descWords = countWords(form.description);
  const extraWords = form.descriptionExtra ? countWords(form.descriptionExtra) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={dashboardHref}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          Back to admin
        </Link>
      </div>

      <DashboardPageHeader
        icon={Users}
        title="Team page"
        description="Manage who appears on the public Our Team page: founder, developers, and digital marketers. Descriptions are limited to 200 words each."
        actions={
          <>
            {totalCount === 0 ? (
              <button
                type="button"
                disabled={seeding}
                onClick={() => void importDefaults()}
                className={dashboardHeaderActionSecondary}
              >
                {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Import default roster
              </button>
            ) : null}
            <button type="button" onClick={() => openCreate()} className={dashboardHeaderActionPrimary}>
              <Plus size={18} />
              Add team member
            </button>
            <Link href={publicPathForLocale(locale, '/team')} className={dashboardHeaderActionSecondary} target="_blank">
              View public team page
            </Link>
          </>
        }
      />

      {error ? (
        <div className={dashboardNoticeErrorClass}>{error}</div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : !data ? null : (
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Founder</h2>
            {data.founder ? (
              <MemberRow member={data.founder} onEdit={() => openEdit(data.founder!)} onDelete={() => removeMember(data.founder!.id)} />
            ) : (
              <p className="mt-2 text-sm text-slate-500">No founder row yet.</p>
            )}
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Developers</h2>
            <ul className={`mt-3 ${dashboardListFrameClass}`}>
              {data.developers.map((m) => (
                <MemberRow key={m.id} member={m} onEdit={() => openEdit(m)} onDelete={() => removeMember(m.id)} />
              ))}
            </ul>
            {data.developers.length === 0 ? <p className="mt-2 text-sm text-slate-500">None yet.</p> : null}
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Digital marketers</h2>
            <ul className={`mt-3 ${dashboardListFrameClass}`}>
              {data.marketers.map((m) => (
                <MemberRow key={m.id} member={m} onEdit={() => openEdit(m)} onDelete={() => removeMember(m.id)} />
              ))}
            </ul>
            {data.marketers.length === 0 ? <p className="mt-2 text-sm text-slate-500">None yet.</p> : null}
          </section>
        </div>
      )}

      {modalOpen ? (
        <div className={`z-[10000] ${dashboardModalBackdropClass}`}>
          <div
            className={`${dashboardModalFrameClass} max-h-[92vh] max-w-xl overflow-y-auto p-5 shadow-2xl sm:p-6`}
            role="dialog"
            aria-modal="true"
          >
            <div className={`-mx-5 -mt-5 mb-4 sm:-mx-6 sm:-mt-6 ${dashboardPanelHeaderClass}`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {form.id ? 'Edit team member' : 'Add team member'}
              </h3>
            </div>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Section
                <select
                  className={`mt-1 ${dashboardInputClass}`}
                  value={form.section}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, section: e.target.value as TeamMemberPublic['section'] }))
                  }
                >
                  <option value="FOUNDER">Founder</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="MARKETER">Digital marketer</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Sort order (within section)
                <input
                  type="number"
                  min={0}
                  max={999}
                  className={`mt-1 ${dashboardInputClass}`}
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input
                  className={`mt-1 ${dashboardInputClass}`}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Designation
                <input
                  className={`mt-1 ${dashboardInputClass}`}
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Description (max {TEAM_MEMBER_DESCRIPTION_MAX_WORDS} words)
                <textarea
                  rows={5}
                  className={`mt-1 ${dashboardInputClass}`}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  {descWords} / {TEAM_MEMBER_DESCRIPTION_MAX_WORDS} words
                </span>
              </label>
              {form.section === 'FOUNDER' ? (
                <label className="block text-sm font-medium text-slate-700">
                  Second paragraph — founder only (max {TEAM_MEMBER_DESCRIPTION_MAX_WORDS} words, optional)
                  <textarea
                    rows={4}
                    className={`mt-1 ${dashboardInputClass}`}
                    value={form.descriptionExtra ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, descriptionExtra: e.target.value || null }))}
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    {extraWords} / {TEAM_MEMBER_DESCRIPTION_MAX_WORDS} words
                  </span>
                </label>
              ) : null}
              <label className="block text-sm font-medium text-slate-700">
                Image alt text (optional)
                <input
                  className={`mt-1 ${dashboardInputClass}`}
                  value={form.imageAlt ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, imageAlt: e.target.value }))}
                />
              </label>
              <div>
                <p className="text-sm font-medium text-slate-700">Photo</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Choose a JPEG, PNG, or WebP (up to 10 MB). You will see the full photo, then drag the square to crop
                  before it is uploaded.
                </p>
                <input
                  ref={teamPhotoInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="Choose photo to crop"
                  disabled={uploading || Boolean(cropSrc)}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    onLocalPhotoFileChosen(f);
                    e.target.value = '';
                  }}
                />
                {cropSrc ? (
                  <div className="mt-3">
                    <TeamPhotoCropper
                      imageSrc={cropSrc}
                      onCancel={revokeCropObjectUrl}
                      onApply={uploadCroppedTeamPhoto}
                      onError={(msg) => setError(msg)}
                    />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => teamPhotoInputRef.current?.click()}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-violet-400 hover:bg-violet-50/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploading ? (
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-violet-600" aria-hidden />
                      ) : (
                        <Upload className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
                      )}
                      {uploading ? 'Uploading…' : form.imageUrl ? 'Choose new image to crop' : 'Choose image to crop'}
                    </button>
                    {form.imageUrl ? (
                      <div className="mt-3">
                        <p className="mb-1 text-xs font-medium text-slate-500">Current photo</p>
                        <div className={`relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden bg-slate-100 !p-0 dark:bg-slate-800 ${dashboardNestedCardClass}`}>
                          <Image
                            src={form.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            style={previewStyle()}
                            unoptimized={form.imageUrl.startsWith('/api/media')}
                          />
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className={dashboardHeaderActionSecondary}
                onClick={closeMemberModal}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                className={`inline-flex items-center gap-2 disabled:opacity-50 ${dashboardHeaderActionPrimary}`}
                onClick={() => void saveModal()}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MemberRow({
  member,
  onEdit,
  onDelete,
}: {
  member: TeamMemberPublic;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        <Image
          src={member.imageUrl}
          alt=""
          fill
          className="object-cover"
          style={{
            transform: `translate(${member.imageOffsetX}%, ${member.imageOffsetY}%) scale(${member.imageScale})`,
            transformOrigin: 'center center',
          }}
          unoptimized={member.imageUrl.startsWith('/api/media')}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{member.name}</p>
        <p className="text-xs text-slate-500">
          {member.section} · order {member.sortOrder}
        </p>
      </div>
      <button type="button" className={`${dashboardIconButtonClass} h-9 w-9`} onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={`${dashboardIconButtonClass} h-9 w-9 border-red-200/80 text-red-700 hover:border-red-300 hover:bg-red-50/80 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40`}
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
