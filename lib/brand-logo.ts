/** Responsive WebP brandmarks (tight crop). Bump `LOGO_ASSET_VERSION` after changing files. */
export const LOGO_ASSET_VERSION = '8';

export const brandLogoSrc = (w: 320 | 640) => `/doddapaneni-logo-${w}.webp?v=${LOGO_ASSET_VERSION}`;

export const brandLogoSrcSet = `${brandLogoSrc(320)} 320w, ${brandLogoSrc(640)} 640w`;

/** Layout box matches Navbar (`h-20`); intrinsic 640px file for aspect ratio / CLS. */
export const BRAND_LOGO_INTRINSIC = { width: 640, height: 161 } as const;
