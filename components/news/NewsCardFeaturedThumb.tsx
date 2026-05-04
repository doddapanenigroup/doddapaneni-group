import Image from 'next/image';

type Props = {
  src: string;
  alt: string;
  sizes: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Appended after base classes (e.g. `group-hover:opacity-95`). */
  className?: string;
};

/**
 * Fixed-height news card media: one layer, `object-cover`, so the holder is always
 * filled edge-to-edge (no letterboxing). `object-position` favors the top of the
 * asset where titles/logos usually sit on OG-style graphics.
 */
export default function NewsCardFeaturedThumb({
  src,
  alt,
  sizes,
  loading = 'lazy',
  fetchPriority,
  className = '',
}: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={[
        'h-full w-full object-cover object-[center_22%]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      loading={loading}
      fetchPriority={fetchPriority}
    />
  );
}
