/** Consistent labels for login-log rows (admin insights, observability, sessions). */

export type LoginLogUserFields = {
  userEmail: string;
  userName: string | null | undefined;
  userUsername: string | null | undefined;
  userRole: string;
};

export function formatLoginLogSummary(u: LoginLogUserFields): string {
  const name = u.userName?.trim() || null;
  const handle = u.userUsername?.trim() || null;
  const parts: string[] = [];
  if (name) parts.push(name);
  if (handle) parts.push(`@${handle}`);
  const who = parts.length > 0 ? parts.join(' · ') : u.userEmail;
  return `${who} · ${u.userEmail} · ${u.userRole}`;
}
