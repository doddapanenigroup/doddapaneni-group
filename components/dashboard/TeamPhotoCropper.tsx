'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Loader2 } from 'lucide-react';
import { getCroppedImageWebp } from '@/lib/team-photo-crop-utils';
import {
  dashboardHeaderActionPrimary,
  dashboardHeaderActionSecondary,
  dashboardNestedCardClass,
} from '@/lib/dashboard-ui';

type Props = {
  imageSrc: string;
  onCancel: () => void;
  /** Receives cropped WebP file; should upload and update parent form. */
  onApply: (file: File) => Promise<void>;
  onError: (message: string) => void;
};

export default function TeamPhotoCropper({ imageSrc, onCancel, onApply, onError }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [hasCrop, setHasCrop] = useState(false);
  const pixelsRef = useRef<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    pixelsRef.current = pixels;
    setHasCrop(true);
  }, []);

  useEffect(() => {
    setHasCrop(false);
    pixelsRef.current = null;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, [imageSrc]);

  async function handleApply() {
    const px = pixelsRef.current;
    if (!px) {
      onError('Adjust the crop area first.');
      return;
    }
    setBusy(true);
    try {
      const blob = await getCroppedImageWebp(imageSrc, px);
      const file = new File([blob], 'team-member-photo.webp', { type: 'image/webp' });
      await onApply(file);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not crop image');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`p-3 ${dashboardNestedCardClass}`}>
      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        The whole photo is shown. Drag the square to frame the face or area you want. Use zoom to see more of the
        image, then move the square again if needed.
      </p>
      <div className="relative mt-2 h-[260px] w-full overflow-hidden rounded-lg bg-slate-900 sm:h-[300px]">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="rect"
          showGrid
          objectFit="contain"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          minZoom={1}
          maxZoom={3}
        />
      </div>
      <label className="mt-3 block text-xs font-medium text-slate-600 dark:text-slate-300">
        Zoom ({zoom.toFixed(2)}×)
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          className="mt-1 w-full accent-violet-600"
          onChange={(e) => setZoom(Number(e.target.value))}
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className={`${dashboardHeaderActionSecondary} disabled:opacity-50`}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || !hasCrop}
          onClick={() => void handleApply()}
          className={`inline-flex min-w-[10rem] flex-1 items-center justify-center gap-2 disabled:opacity-50 sm:flex-initial ${dashboardHeaderActionPrimary}`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {busy ? 'Uploading…' : 'Use crop & upload'}
        </button>
      </div>
    </div>
  );
}
