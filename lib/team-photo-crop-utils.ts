export type PixelCrop = { x: number; y: number; width: number; height: number };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Draw the crop region from `imageSrc` into a WebP blob, downscaled so the longest side is at most `maxSide`.
 */
export async function getCroppedImageWebp(
  imageSrc: string,
  pixelCrop: PixelCrop,
  maxSide = 1024,
  quality = 0.9,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const sx = Math.max(0, Math.round(pixelCrop.x));
  const sy = Math.max(0, Math.round(pixelCrop.y));
  const sw = Math.min(Math.round(pixelCrop.width), image.naturalWidth - sx);
  const sh = Math.min(Math.round(pixelCrop.height), image.naturalHeight - sy);
  if (sw <= 0 || sh <= 0) {
    throw new Error('Invalid crop region');
  }

  let dw = sw;
  let dh = sh;
  const longest = Math.max(dw, dh);
  if (longest > maxSide) {
    const scale = maxSide / longest;
    dw = Math.round(dw * scale);
    dh = Math.round(dh * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not encode image'));
      },
      'image/webp',
      quality,
    );
  });
}
