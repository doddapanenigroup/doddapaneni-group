export const DIVISION_SUBPAGES = ['about', 'services', 'contact'] as const;

export type DivisionSubpage = (typeof DIVISION_SUBPAGES)[number];

export function divisionContentPageKey(sectorSlug: string, sub: DivisionSubpage): string {
  return `${sectorSlug}-${sub}`;
}

export function getDivisionSubpageLabel(sub: DivisionSubpage): string {
  switch (sub) {
    case 'about':
      return 'About';
    case 'services':
      return 'Services';
    case 'contact':
      return 'Contact';
    default:
      return sub;
  }
}

export function getDivisionSubpagePlaceholder(
  sectorName: string,
  sub: DivisionSubpage,
): { heading: string; paragraphs: string[] } {
  switch (sub) {
    case 'about':
      return {
        heading: `About ${sectorName}`,
        paragraphs: [
          `This is placeholder content for the ${sectorName} division. Replace it with your story, leadership notes, and credentials when ready.`,
          'Mission, history, and differentiators will live here. You can also publish rich HTML via the marketer dashboard using the matching content page key.',
        ],
      };
    case 'services':
      return {
        heading: `Services — ${sectorName}`,
        paragraphs: [
          `Outline flagship offers, delivery models, and engagement types for ${sectorName}. This block is stand-in text only.`,
          'Consider listing service lines, SLAs, and industries served. Structured content can later replace this section from the CMS.',
        ],
      };
    case 'contact':
      return {
        heading: `Contact ${sectorName}`,
        paragraphs: [
          `Placeholder contact guidance for the ${sectorName} team. Add office details, routing rules, or a form embed in this area.`,
          'For site-wide contact, visitors can still use the main Contact page linked from the header.',
        ],
      };
    default:
      return { heading: sectorName, paragraphs: [] };
  }
}
