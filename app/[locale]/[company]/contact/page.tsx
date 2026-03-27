import { divisionSubMetadata, divisionSubPage } from '@/lib/company-division-sub-route';

const sub = 'contact' as const;

export const generateMetadata = divisionSubMetadata(sub);
export default divisionSubPage(sub);
