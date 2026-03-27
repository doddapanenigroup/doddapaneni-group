import { divisionSubMetadata, divisionSubPage } from '@/lib/company-division-sub-route';

const sub = 'about' as const;

export const generateMetadata = divisionSubMetadata(sub);
export default divisionSubPage(sub);
