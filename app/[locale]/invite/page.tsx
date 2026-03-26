import InviteClient from '@/app/[locale]/invite/InviteClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function InvitePage() {
  return <InviteClient />;
}

