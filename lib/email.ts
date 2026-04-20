import dns from 'dns';
import nodemailer from 'nodemailer';
import { formatDateISTAndET } from '@/lib/date-timezones';

/** Some hosts truncate env values at `#`; base64 avoids that. Set `SMTP_DNS_IPV4_FIRST=1` if SMTP hangs (IPv6 issues). */
function maybePreferIpv4ForSmtp(): void {
  if (process.env.SMTP_DNS_IPV4_FIRST !== '1' && process.env.SMTP_DNS_IPV4_FIRST !== 'true') return;
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch {
    /* Node < 17 */
  }
}

const ROLES_FOR_LOGIN_EMAIL = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'DIGITAL_MARKETER'] as const;

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  DIGITAL_MARKETER: 'Digital Marketer',
};

export function shouldSendLoginSuccessEmail(role: string): boolean {
  return ROLES_FOR_LOGIN_EMAIL.includes(role as (typeof ROLES_FOR_LOGIN_EMAIL)[number]);
}

/** SMTP login / From address (supports aliases for common .env setups). */
export function getSmtpUser(): string | undefined {
  const u =
    process.env.EMAIL_USER?.trim() ||
    process.env.SMTP_USER?.trim();
  return u || undefined;
}

function getSmtpPassword(): string | undefined {
  const b64 = process.env.EMAIL_PASS_B64?.trim() || process.env.SMTP_PASS_B64?.trim();
  if (b64) {
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf8');
      return decoded || undefined;
    } catch {
      return undefined;
    }
  }
  const p =
    process.env.EMAIL_PASS?.trim() ||
    process.env.SMTP_PASS?.trim() ||
    process.env.GMAIL_APP_PASSWORD?.trim();
  if (!p) return undefined;
  // Strip wrapping quotes some deployment UIs store literally in the value.
  if (
    (p.startsWith('"') && p.endsWith('"') && p.length >= 2) ||
    (p.startsWith("'") && p.endsWith("'") && p.length >= 2)
  ) {
    return p.slice(1, -1) || undefined;
  }
  return p;
}

function mailFromHeader(): string {
  const user = getSmtpUser() ?? 'noreply@localhost';
  return `"Doddapaneni Group" <${user}>`;
}

/** Nodemailer transport for Gmail (no SMTP_HOST) or custom SMTP (SMTP_HOST set). Returns null if creds missing. */
export function createMailTransporter(): nodemailer.Transporter | null {
  const user = getSmtpUser();
  const pass = getSmtpPassword();
  if (!user || !pass) return null;

  const host = process.env.SMTP_HOST?.trim();
  if (host) {
    maybePreferIpv4ForSmtp();
    const port = Number(process.env.SMTP_PORT || '587');
    const secureFlag = process.env.SMTP_SECURE;
    const secure =
      secureFlag === 'true' ||
      secureFlag === '1' ||
      (port === 465 && secureFlag !== 'false' && secureFlag !== '0');
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 25_000,
      greetingTimeout: 25_000,
      requireTLS: !secure && port === 587,
      tls: { minVersion: 'TLSv1.2' },
    });
  }

  // Gmail app passwords are shown with spaces; nodemailer/auth often needs the 16 chars concatenated.
  const gmailUser = user.trim().toLowerCase();
  const gmailPass = pass.replace(/\s+/g, '');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  });
}

function getTransporter(): nodemailer.Transporter | null {
  return createMailTransporter();
}

/** True when outbound SMTP credentials are present (Gmail or custom SMTP_HOST). */
export function isLoginEmailDeliveryConfigured(): boolean {
  return !!(getSmtpUser() && getSmtpPassword());
}

/** Maps Nodemailer/SMTP errors to a short message (no secrets). Use in API routes when send fails. */
export function smtpFailureUserMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const response =
    err && typeof err === 'object' && 'response' in err
      ? String((err as { response?: string }).response ?? '')
      : '';
  const combined = `${msg} ${response}`.toLowerCase();

  if (
    combined.includes('invalid login') ||
    combined.includes('535') ||
    combined.includes('authentication unsuccessful') ||
    combined.includes('auth failed') ||
    combined.includes('535 5.7.8')
  ) {
    return 'Email could not be sent: SMTP login failed. Check EMAIL_USER and password. If the password contains # or special characters, set EMAIL_PASS_B64 (base64 of the password) in Hostinger or change the mailbox password.';
  }
  if (
    combined.includes('etimedout') ||
    combined.includes('econnrefused') ||
    combined.includes('enotfound') ||
    combined.includes('greeting timeout') ||
    combined.includes('timeout')
  ) {
    return 'Email could not be sent: the app could not reach the mail server. Try SMTP_PORT=587 and SMTP_SECURE=false, or set SMTP_DNS_IPV4_FIRST=1.';
  }
  if (
    combined.includes('certificate') ||
    combined.includes('self signed') ||
    combined.includes('unable to verify the first certificate')
  ) {
    return 'Email could not be sent: TLS error connecting to SMTP. Try SMTP_PORT=587 and SMTP_SECURE=false.';
  }
  return 'Could not send verification email.';
}

/**
 * Send "Login successful" email to the user. Used for Admin, Super Admin, Developer, Digital Marketer.
 * Does nothing if EMAIL_USER/EMAIL_PASS are not set.
 */
export async function sendLoginSuccessEmail(
  to: string,
  name: string | null,
  role: string
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  const displayName = name?.trim() || to;
  const now = new Date();
  const { ist: timeIST, et: timeET } = formatDateISTAndET(now);

  await transporter.sendMail({
    from: mailFromHeader(),
    to,
    subject: 'You have successfully logged in – Doddapaneni Group',
    text: `Hello ${displayName},\n\nYou have successfully logged in to the Doddapaneni Group dashboard (${role}).\n\nDate & time (IST): ${timeIST}\nDate & time (ET): ${timeET}\n\nIf you did not perform this login, please contact your administrator.\n\nBest regards,\nDoddapaneni Group`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #eee; padding-bottom: 10px;">Login successful</h2>
        <p>Hello <strong>${displayName}</strong>,</p>
        <p>You have successfully logged in to the Doddapaneni Group dashboard.</p>
        <p><strong>Role:</strong> ${role}</p>
        <p><strong>Date & time (IST):</strong> ${timeIST}<br/><strong>Date & time (ET):</strong> ${timeET}</p>
        <p>If you did not perform this login, please contact your administrator.</p>
        <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #666;">
          <p style="margin: 0;">Best regards,</p>
          <p style="margin: 5px 0 0; font-weight: bold; color: #1e3a8a;">Doddapaneni Group</p>
        </div>
      </div>
    `,
  });
}

export async function sendUserInviteEmail(args: {
  to: string;
  invitedByEmail: string;
  invitedByName: string | null;
  roleLabel: string;
  inviteUrl: string;
  expiresInHours: number;
}): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error(
      'Email is not configured (set EMAIL_USER + EMAIL_PASS, or SMTP_USER + SMTP_PASS, or SMTP_HOST + SMTP_USER + SMTP_PASS)'
    );
  }

  const displayName = args.invitedByName?.trim() || args.invitedByEmail;

  await transporter.sendMail({
    from: mailFromHeader(),
    to: args.to,
    subject: 'You are invited – Doddapaneni Group',
    text: `Hello,\n\n${displayName} invited you to join the Doddapaneni Group dashboard as: ${args.roleLabel}\n\nSet your password using this link (expires in ${args.expiresInHours} hours):\n${args.inviteUrl}\n\nIf you were not expecting this invite, you can ignore this email.\n\nDoddapaneni Group`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <h2 style="color: #1e3a8a;">You’re invited</h2>
        <p>Hello,</p>
        <p><strong>${displayName}</strong> invited you to join the Doddapaneni Group dashboard.</p>
        <p><strong>Role:</strong> ${args.roleLabel}</p>
        <p>
          <a href="${args.inviteUrl}" style="display:inline-block; background:#1e3a8a; color:#fff; text-decoration:none; padding:12px 16px; border-radius:10px; font-weight:600;">
            Set your password
          </a>
        </p>
        <p style="font-size: 14px; color: #666;">This invite link expires in ${args.expiresInHours} hours.</p>
        <p style="font-size: 14px; color: #666;">If you were not expecting this invite, you can ignore this email.</p>
        <p style="margin-top: 24px; font-size: 14px; color: #1e3a8a; font-weight: bold;">Doddapaneni Group</p>
      </div>
    `,
  });
}

/**
 * Send email to the creator (e.g. Super Admin or Admin) when they create a new role.
 * Content: "[Role] was created by [creator role] at [date and time IST/ET]."
 */
export async function sendRoleCreatedEmailToCreator(
  creatorEmail: string,
  creatorRole: string,
  createdRole: string,
  createdAt: Date
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  const creatorRoleLabel = ROLE_LABEL[creatorRole] ?? creatorRole;
  const createdRoleLabel = ROLE_LABEL[createdRole] ?? createdRole;
  const { ist, et } = formatDateISTAndET(createdAt);

  const text = `${createdRoleLabel} role was created by ${creatorRoleLabel} at ${ist} and ${et}.`;
  await transporter.sendMail({
    from: mailFromHeader(),
    to: creatorEmail,
    subject: `Role created: ${createdRoleLabel} – Doddapaneni Group`,
    text: `Hello,\n\n${text}\n\nBest regards,\nDoddapaneni Group`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #eee; padding-bottom: 10px;">Role created</h2>
        <p>${text}</p>
        <p><strong>Date & time (IST):</strong> ${ist}<br/><strong>Date & time (ET):</strong> ${et}</p>
        <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #666;">
          <p style="margin: 0;">Best regards,</p>
          <p style="margin: 5px 0 0; font-weight: bold; color: #1e3a8a;">Doddapaneni Group</p>
        </div>
      </div>
    `,
  });
}

/**
 * Send email to the new user when they are created. Includes the password set by the creator.
 */
export async function sendRoleCreatedEmailToNewUser(
  newUserEmail: string,
  newUserName: string | null,
  createdRole: string,
  creatorRole: string,
  creatorName: string | null,
  createdAt: Date,
  password: string
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  const createdRoleLabel = ROLE_LABEL[createdRole] ?? createdRole;
  const creatorRoleLabel = ROLE_LABEL[creatorRole] ?? creatorRole;
  const creatorDisplay = creatorName?.trim() ? `${creatorRoleLabel} (${creatorName.trim()})` : creatorRoleLabel;
  const { ist, et } = formatDateISTAndET(createdAt);
  const displayName = newUserName?.trim() || newUserEmail;

  const text = `You have been created as ${createdRoleLabel} for Doddapaneni Group by ${creatorDisplay}, at ${ist} and ${et}.`;
  await transporter.sendMail({
    from: mailFromHeader(),
    to: newUserEmail,
    subject: `You have been added as ${createdRoleLabel} – Doddapaneni Group`,
    text: `Hello ${displayName},\n\n${text}\n\nLogin details:\nEmail: ${newUserEmail}\nPassword: ${password}\n\nUse the above to log in to the Doddapaneni Group dashboard.\n\nBest regards,\nDoddapaneni Group`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #eee; padding-bottom: 10px;">Welcome to Doddapaneni Group</h2>
        <p>Hello <strong>${displayName}</strong>,</p>
        <p>${text}</p>
        <p><strong>Date & time (IST):</strong> ${ist}<br/><strong>Date & time (ET):</strong> ${et}</p>
        <p><strong>Login details:</strong></p>
        <p style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-family: monospace;">Email: ${newUserEmail}<br/>Password: ${password}</p>
        <p>Use the above to log in to the Doddapaneni Group dashboard.</p>
        <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #666;">
          <p style="margin: 0;">Best regards,</p>
          <p style="margin: 5px 0 0; font-weight: bold; color: #1e3a8a;">Doddapaneni Group</p>
        </div>
      </div>
    `,
  });
}

/**
 * Send email to the deleter (Admin or Super Admin) when they delete a user.
 * Content: "[Role] was deleted by [deleter role] at [date and time IST/ET]. Deleted user: email (name)."
 */
export async function sendRoleDeletedEmailToDeleter(
  deleterEmail: string,
  deleterRole: string,
  deletedUserEmail: string,
  deletedUserName: string | null,
  deletedUserRole: string,
  deletedAt: Date
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  const deleterRoleLabel = ROLE_LABEL[deleterRole] ?? deleterRole;
  const deletedRoleLabel = ROLE_LABEL[deletedUserRole] ?? deletedUserRole;
  const deletedUserDisplay = deletedUserName?.trim() ? `${deletedUserEmail} (${deletedUserName.trim()})` : deletedUserEmail;
  const { ist, et } = formatDateISTAndET(deletedAt);

  const text = `${deletedRoleLabel} role was deleted by ${deleterRoleLabel} at ${ist} and ${et}. Deleted user: ${deletedUserDisplay}.`;
  await transporter.sendMail({
    from: mailFromHeader(),
    to: deleterEmail,
    subject: `Role deleted: ${deletedRoleLabel} – Doddapaneni Group`,
    text: `Hello,\n\n${text}\n\nBest regards,\nDoddapaneni Group`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #eee; padding-bottom: 10px;">Role deleted</h2>
        <p>${text}</p>
        <p><strong>Date & time (IST):</strong> ${ist}<br/><strong>Date & time (ET):</strong> ${et}</p>
        <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #666;">
          <p style="margin: 0;">Best regards,</p>
          <p style="margin: 5px 0 0; font-weight: bold; color: #1e3a8a;">Doddapaneni Group</p>
        </div>
      </div>
    `,
  });
}

/**
 * Send email to the deleted user notifying them their account was removed.
 * Content: "Your [role] account for Doddapaneni Group was deleted by [deleter role] (Deleter Name), at [date and time IST/ET]."
 */
export async function sendRoleDeletedEmailToDeletedUser(
  deletedUserEmail: string,
  deletedUserName: string | null,
  deletedUserRole: string,
  deleterRole: string,
  deleterName: string | null,
  deletedAt: Date
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  const deletedRoleLabel = ROLE_LABEL[deletedUserRole] ?? deletedUserRole;
  const deleterRoleLabel = ROLE_LABEL[deleterRole] ?? deleterRole;
  const deleterDisplay = deleterName?.trim() ? `${deleterRoleLabel} (${deleterName.trim()})` : deleterRoleLabel;
  const { ist, et } = formatDateISTAndET(deletedAt);
  const displayName = deletedUserName?.trim() || deletedUserEmail;

  const text = `Your ${deletedRoleLabel} account for Doddapaneni Group was deleted by ${deleterDisplay}, at ${ist} and ${et}.`;
  await transporter.sendMail({
    from: mailFromHeader(),
    to: deletedUserEmail,
    subject: `Your ${deletedRoleLabel} account has been removed – Doddapaneni Group`,
    text: `Hello ${displayName},\n\n${text}\n\nIf you have questions, please contact your administrator.\n\nBest regards,\nDoddapaneni Group`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #eee; padding-bottom: 10px;">Account removed</h2>
        <p>Hello <strong>${displayName}</strong>,</p>
        <p>${text}</p>
        <p><strong>Date & time (IST):</strong> ${ist}<br/><strong>Date & time (ET):</strong> ${et}</p>
        <p>If you have questions, please contact your administrator.</p>
        <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #666;">
          <p style="margin: 0;">Best regards,</p>
          <p style="margin: 5px 0 0; font-weight: bold; color: #1e3a8a;">Doddapaneni Group</p>
        </div>
      </div>
    `,
  });
}
