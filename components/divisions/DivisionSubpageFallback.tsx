import { createTranslator } from '@/lib/translation-format';
import { getDictionary } from '@/lib/translations';
import CompanyDivisionSubPageContent from '@/components/divisions/CompanyDivisionSubPageContent';
import {
  divisionContentPageKey,
  type DivisionSubpage,
} from '@/lib/company-division-subpages';

type Props = {
  sectorSlug: string;
  subpage: DivisionSubpage;
  sectorName: string;
  locale: string;
  /** When true, `CompanyDivisionShell` sits above — hero only needs a modest gap under the division band. */
  embeddedInDivisionShell?: boolean;
};

export default async function DivisionSubpageFallback({
  sectorSlug,
  subpage,
  sectorName,
  locale,
  embeddedInDivisionShell = false,
}: Props) {
  const t = createTranslator(getDictionary(locale), 'DivisionSubpage');
  const pageKey = divisionContentPageKey(sectorSlug, subpage);
  const key = subpage;

  const heading = t(`${key}.heading`, { sectorName });
  const paragraphs = [
    t(`${key}.p0`, { sectorName }),
    t(`${key}.p1`, { sectorName }),
  ];

  return (
    <CompanyDivisionSubPageContent
      heading={heading}
      paragraphs={paragraphs}
      pageKey={pageKey}
      cmsKeyHint={t('cmsKeyHint')}
      cmsKeyNote={t('cmsKeyNote')}
      embeddedInDivisionShell={embeddedInDivisionShell}
    />
  );
}
