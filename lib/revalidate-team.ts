import { revalidatePath } from 'next/cache';
import { routing } from '@/i18n/routing';

/** Call after team roster mutations so `/team` picks up changes. */
export function revalidateTeamPublicPaths(): void {
  try {
    revalidatePath('/team', 'page');
    for (const loc of routing.locales) {
      if (loc === routing.defaultLocale) continue;
      revalidatePath(`/${loc}/team`, 'page');
    }
  } catch {
    /* best-effort */
  }
}
