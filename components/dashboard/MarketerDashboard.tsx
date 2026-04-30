'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Trash2, Image as ImageIcon, Search } from 'lucide-react';
import { useDashboardShortcuts } from '@/components/dashboard/DashboardShortcutsProvider';
import MarketerBlogsManager, { type MarketerBlogsManagerHandle } from '@/components/dashboard/MarketerBlogsManager';
import { useMarketerNav } from '@/components/dashboard/MarketerNavProvider';
import {
  dashboardHeaderActionSecondary,
  dashboardInputShellClass,
  dashboardMainMaxClass,
  dashboardNestedCardClass,
  dashboardPanelClass,
  dashboardPanelHeaderClass,
  dashboardStageClass,
} from '@/lib/dashboard-ui';

type StoredImageRow = {
  id: string;
  key: string;
  url: string;
  fileName: string | null;
  altText: string | null;
  size: number | null;
  updatedAt: string;
};

export default function MarketerDashboard({ locale, canBlogs }: { locale: string; canBlogs: boolean }) {
  const { data: sessionData } = useSession();
  const { pushSaveLayer } = useDashboardShortcuts();
  const authorLabel = sessionData?.user?.email ?? sessionData?.user?.name ?? '—';
  const { section, setSection, registerMarketerCaps } = useMarketerNav();

  const [images, setImages] = useState<StoredImageRow[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imageSearch, setImageSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const blogsManagerRef = useRef<MarketerBlogsManagerHandle>(null);

  useLayoutEffect(() => {
    registerMarketerCaps({ canPages: false, canBlogs });
    setSection(canBlogs ? 'blogs' : 'media');
    return () => registerMarketerCaps({ canPages: false, canBlogs: false });
  }, [canBlogs, registerMarketerCaps, setSection]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setImagesLoading(true);
      try {
        const r = await fetch('/api/marketer/stored-image');
        const d = r.ok ? await r.json() : null;
        if (!cancelled) setImages((d?.items ?? []) as StoredImageRow[]);
      } catch {
        if (!cancelled) setImages([]);
      } finally {
        if (!cancelled) setImagesLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function uploadImage(file: File, altText: string) {
    const form = new FormData();
    form.append('file', file);
    if (altText.trim()) form.append('altText', altText.trim());
    setUploading(true);
    try {
      const res = await fetch('/api/marketer/stored-image', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) return;
      setImages((prev) => [
        {
          id: data.id ?? `${Date.now()}`,
          key: data.key,
          url: data.url,
          fileName: data.fileName ?? null,
          altText: data.altText ?? null,
          size: data.size ?? null,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setUploading(false);
    }
  }

  async function copyImageUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      alert('Copy failed. Please copy the URL manually.');
    }
  }

  async function deleteImage(key: string) {
    if (!confirm('Delete this image?')) return;
    const res = await fetch(`/api/marketer/stored-image/${encodeURIComponent(key)}`, { method: 'DELETE' });
    if (!res.ok) return;
    setImages((prev) => prev.filter((i) => i.key !== key));
  }

  const filteredImages = images.filter((i) => {
    if (!imageSearch.trim()) return true;
    const t = imageSearch.toLowerCase();
    return (
      i.key.toLowerCase().includes(t) ||
      (i.fileName ?? '').toLowerCase().includes(t) ||
      (i.altText ?? '').toLowerCase().includes(t)
    );
  });

  const marketerSaveRef = useRef<() => void>(() => {});
  marketerSaveRef.current = () => {
    if (section === 'blogs' && canBlogs) {
      blogsManagerRef.current?.requestSave();
    }
  };

  useEffect(() => {
    return pushSaveLayer(() => {
      marketerSaveRef.current();
    });
  }, [pushSaveLayer]);

  return (
    <div className={`${dashboardMainMaxClass} space-y-6`}>
      <div className={dashboardStageClass}>
        <div className="flex min-w-0 flex-col gap-6">
          {section === 'blogs' && canBlogs && (
            <MarketerBlogsManager
              ref={blogsManagerRef}
              locale={locale}
              authorLabel={authorLabel}
              setImages={setImages}
            />
          )}

          {section === 'media' && canBlogs && (
            <section className={dashboardPanelClass}>
              <div className={`flex items-center gap-2 ${dashboardPanelHeaderClass}`}>
                <ImageIcon size={18} className="text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-800">Media library (StoredImage)</h2>
              </div>
              <div className="space-y-4 p-5">
                <div className="grid items-center gap-3 sm:grid-cols-3">
                  <label className={`cursor-pointer text-sm ${dashboardHeaderActionSecondary}`}>
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        uploadImage(file, '');
                      }}
                    />
                  </label>
                  <div className={`sm:col-span-2 ${dashboardInputShellClass} items-center gap-2 px-3 py-2`}>
                    <Search size={16} className="shrink-0 text-slate-500" />
                    <input
                      value={imageSearch}
                      onChange={(e) => setImageSearch(e.target.value)}
                      placeholder="Search by file name / alt text"
                      className="min-w-0 flex-1 border-0 bg-transparent py-1 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 dark:text-slate-100"
                    />
                  </div>
                </div>
                {imagesLoading || uploading ? (
                  <p className="text-sm text-slate-500">Loading media...</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredImages.slice(0, 24).map((img) => (
                      <div
                        key={img.id}
                        role="button"
                        tabIndex={0}
                        className={`cursor-pointer text-left !p-2 transition hover:opacity-95 ${dashboardNestedCardClass}`}
                        onClick={() => {
                          blogsManagerRef.current?.applyImageFromLibrary(img.url);
                        }}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyImageUrl(img.url);
                            }}
                            className={`py-1 text-[11px] ${dashboardHeaderActionSecondary}`}
                          >
                            Copy URL
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteImage(img.key);
                            }}
                            className={`p-2 ${dashboardHeaderActionSecondary}`}
                            aria-label="Delete image"
                            title="Delete image"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.altText ?? img.fileName ?? 'image'}
                          className="mb-2 h-24 w-full rounded-md object-cover"
                        />
                        <p className="truncate text-xs font-medium text-slate-800">{img.fileName ?? img.key}</p>
                        <p className="truncate text-[11px] text-slate-500">{img.key}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
