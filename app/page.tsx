import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function RootPage() {
  // Ensure `/` never 404s. Send users to the default locale homepage.
  redirect(`/${routing.defaultLocale}`);
}

