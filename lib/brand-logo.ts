/** Responsive WebP brandmarks (tight crop). Bump `LOGO_ASSET_VERSION` after changing files. */
export const LOGO_ASSET_VERSION = '9';

export type BrandLogoWidth = 320 | 480 | 640;

export const brandLogoSrc = (w: BrandLogoWidth) => `/doddapaneni-logo-${w}.webp?v=${LOGO_ASSET_VERSION}`;

export const brandLogoSrcSet = `${brandLogoSrc(320)} 320w, ${brandLogoSrc(480)} 480w, ${brandLogoSrc(640)} 640w`;

/** Matches default `src` (`480w`) for aspect ratio / CLS. */
export const BRAND_LOGO_INTRINSIC = { width: 480, height: 121 } as const;
