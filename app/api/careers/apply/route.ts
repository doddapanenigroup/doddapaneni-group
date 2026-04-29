import { NextResponse } from 'next/server';
import type { Transporter } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import {
  createMailTransporter,
  getSmtpUser,
  isLoginEmailDeliveryConfigured,
  smtpFailureUserMessage,
} from '@/lib/email';
import { connectDb, prisma } from '@/lib/db';
import { recordApiRequest } from '@/lib/request-monitor';
import { routing } from '@/i18n/routing';
import { normalizeLanguagesKnownForJob, parseApplyLanguageCodesCsv } from '@/lib/career-apply-languages';
import { handleCorsOptions, withCors } from '@/lib/site-origin-cors';

/**
 * HTTP handler finishes right after DB write; SMTP runs in the background so proxies (nginx on
 * DigitalOcean) do not return 504 while Yahoo/Gmail accept large attachments.
 */
export const maxDuration = 60;

/** Used only for background `sendMail` — does not block the JSON response. */
const CAREERS_SMTP_BACKGROUND = {
  connectionTimeoutMs: 22_000,
  greetingTimeoutMs: 22_000,
  socketTimeoutMs: 55_000,
} as const;

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

function isCareersDevRelaxed(): boolean {
  return process.env.NODE_ENV === 'development';
}

const SAME_MAILBOX_PLUS_ALIAS_DOMAINS = new Set([
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.co.in',
  'yahoo.ca',
  'yahoo.fr',
  'yahoo.de',
  'yahoo.es',
  'yahoo.it',
  'yahoo.com.br',
  'yahoo.com.au',
  'ymail.com',
  'rocketmail.com',
  'gmail.com',
  'googlemail.com',
]);

function careersAdminRecipientForSmtp(smtpFrom: string, notifyTo: string): string {
  const from = smtpFrom.trim().toLowerCase();
  const raw = notifyTo.trim();
  const to = raw.toLowerCase();
  if (!from || !to || from !== to) return raw;
  const at = raw.lastIndexOf('@');
  if (at <= 0) return raw;
  const domain = raw.slice(at + 1).toLowerCase();
  if (!SAME_MAILBOX_PLUS_ALIAS_DOMAINS.has(domain)) return raw;
  const local = raw.slice(0, at);
  if (local.includes('+')) return raw;
  return `${local}+dg-careers@${raw.slice(at + 1)}`;
}

function getStr(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

function isAllowedResume(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx')) return true;
  const mt = (file.type || '').toLowerCase();
  return (
    mt === 'application/pdf' ||
    mt === 'application/msword' ||
    mt === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

function simpleEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isCareersApplyDevSkipEmail(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    (process.env.CAREERS_APPLY_DEV_NO_EMAIL === '1' || process.env.CAREERS_APPLY_DEV_NO_EMAIL === 'true')
  );
}

function isLikelyDatabaseError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const ctor =
    error != null && typeof error === 'object' && 'constructor' in error
      ? String((error as { constructor?: { name?: string } }).constructor?.name ?? '')
      : '';
  const blob = `${msg} ${ctor}`;
  return (
    /PrismaClient(Initialization|KnownRequest|RustPanic)Error/.test(ctor) ||
    /Can't reach database server|P1001|P1000|P1017|P1013|Invalid.*prisma/i.test(blob)
  );
}

/**
 * Admin inbox (resume attachment) first, then applicant confirmation — same order as before, but
 * after the HTTP response so gateways do not time out.
 */
function scheduleCareersEmails(transporter: Transporter, adminMail: Mail.Options, userMail: Mail.Options) {
  void (async () => {
    let inboxOk = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await transporter.sendMail(adminMail);
        inboxOk = true;
        break;
      } catch (e) {
        console.error(
          `[careers/apply] background inbox sendMail attempt ${attempt + 1} failed:`,
          smtpFailureUserMessage(e),
        );
      }
    }
    if (!inboxOk) {
      console.error('[careers/apply] background: admin/inbox email failed after retries (application is in DB).');
    }
    try {
      await transporter.sendMail(userMail);
    } catch (e) {
      console.error('[careers/apply] background applicant confirmation failed:', smtpFailureUserMessage(e));
    }
  })();
}

export async function POST(request: Request) {
  const jsonRes = (body: unknown, init?: ResponseInit) =>
    withCors(NextResponse.json(body, init), request);
  try {
    recordApiRequest({ request, userId: null });
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('multipart/form-data')) {
      return jsonRes({ message: 'Expected multipart form data.' }, { status: 400 });
    }

    const form = await request.formData();
    if (getStr(form, 'fax').length > 0) {
      return jsonRes({ message: 'Invalid input' }, { status: 400 });
    }

    const jobSlug = getStr(form, 'jobSlug').toLowerCase();
    const name = getStr(form, 'name');
    const email = getStr(form, 'email');
    const phone = getStr(form, 'phone');
    const location = getStr(form, 'location');
    const positionApplied = getStr(form, 'positionApplied');
    const employmentType = getStr(form, 'employmentType');
    const availabilityNotice = getStr(form, 'availabilityNotice');
    const keySkills = getStr(form, 'keySkills');
    const experienceYears = getStr(form, 'experienceYears');
    const whyApply = getStr(form, 'whyApply');
    const startDate = getStr(form, 'startDate');
    const linkedin = getStr(form, 'linkedin');
    const company = getStr(form, 'company');
    const currentCtc = getStr(form, 'currentCtc');
    const expectedCtc = getStr(form, 'expectedCtc');
    const locale = (getStr(form, 'locale') || routing.defaultLocale).toLowerCase();

    if (getStr(form, 'declarationAccurate') !== '1' || getStr(form, 'declarationLegal') !== '1') {
      return jsonRes({ message: 'Please confirm both declarations.' }, { status: 400 });
    }
    if (!jobSlug || !name || !email || !simpleEmail(email)) {
      return jsonRes({ message: 'Name and a valid email are required.' }, { status: 400 });
    }
    if (!positionApplied) {
      return jsonRes({ message: 'Position applied for is required.' }, { status: 400 });
    }
    if (keySkills.length < 10) {
      return jsonRes({ message: 'Please enter your key skills (at least 10 characters).' }, { status: 400 });
    }
    if (whyApply.length < 20) {
      return jsonRes({ message: 'Please explain why you want to apply (at least 20 characters).' }, { status: 400 });
    }

    const resume = form.get('resume');
    if (!resume || !(resume instanceof File) || resume.size === 0) {
      return jsonRes({ message: 'Please upload your resume (PDF or Word).' }, { status: 400 });
    }
    if (resume.size > MAX_RESUME_BYTES) {
      return jsonRes({ message: 'Resume must be 5 MB or smaller.' }, { status: 400 });
    }
    if (!isAllowedResume(resume)) {
      return jsonRes({ message: 'Resume must be a .pdf, .doc, or .docx file.' }, { status: 400 });
    }

    await connectDb();
    let job: {
      slug: string;
      applyLanguageCodesCsv: string;
      translations: Array<{ locale: string; title: string; subtitle: string }>;
    } | null;
    try {
      job = await prisma.careerJob.findFirst({
        where: { slug: jobSlug, status: 'published' },
        select: {
          slug: true,
          applyLanguageCodesCsv: true,
          translations: { select: { locale: true, title: true, subtitle: true } },
        },
      });
    } catch (e) {
      console.error('[careers/apply] DB', e);
      return jsonRes({ message: 'Careers are temporarily unavailable.' }, { status: 503 });
    }

    if (!job?.translations.length) {
      return jsonRes({ message: 'This role is not open for applications.' }, { status: 404 });
    }

    const jobLanguages = parseApplyLanguageCodesCsv(job.applyLanguageCodesCsv);
    const rawLangSelections = form
      .getAll('languagesKnown')
      .filter((v): v is string => typeof v === 'string');
    const languagesKnown = normalizeLanguagesKnownForJob(rawLangSelections, jobLanguages);
    if (languagesKnown.length === 0) {
      return jsonRes(
        { message: 'Select at least one language you know, from the options listed for this role.' },
        { status: 400 },
      );
    }

    const tr =
      job.translations.find((t) => t.locale === locale) ??
      job.translations.find((t) => t.locale === routing.defaultLocale) ??
      job.translations[0];
    const jobTitle = tr.title;
    const jobSubtitle = tr.subtitle;

    const skipEmailDev = isCareersApplyDevSkipEmail() && !isLoginEmailDeliveryConfigured();

    const resumeBuffer = Buffer.from(await resume.arrayBuffer());
    const safeResumeName = resume.name.replace(/[^\w.\-()+ ]/g, '_').slice(0, 180) || 'resume.pdf';
    const attachment = {
      filename: safeResumeName,
      content: resumeBuffer,
      contentType: resume.type || 'application/octet-stream',
    };

    const payload = {
      jobSlug: job.slug,
      jobTitle,
      jobSubtitle,
      languagesKnown,
      name,
      email,
      phone: phone || null,
      location: location || null,
      positionApplied,
      employmentType: employmentType || null,
      availabilityNotice: availabilityNotice || null,
      keySkills,
      experienceYears: experienceYears || null,
      whyApply,
      startDate: startDate || null,
      linkedin: linkedin || null,
      company: company || null,
      currentCtc: currentCtc || null,
      expectedCtc: expectedCtc || null,
      resumeFileName: safeResumeName,
      resumeSize: resume.size,
      locale,
    };

    const contentType = (attachment.contentType || 'application/octet-stream').trim().slice(0, 200);

    const row = (label: string, val: string) =>
      `<tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;width:160px;font-weight:600;color:#555;">${esc(label)}</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;white-space:pre-wrap;">${esc(val)}</td></tr>`;

    const detailsHtml = `
      <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px;">
        ${row('Role listing', jobTitle)}
        ${row('Position applied for', positionApplied)}
        ${row('Full name', name)}
        ${row('Email', email)}
        ${phone ? row('Phone', phone) : ''}
        ${location ? row('Location', location) : ''}
        ${employmentType ? row('Employment type', employmentType) : ''}
        ${availabilityNotice ? row('Notice period', availabilityNotice) : ''}
        ${experienceYears ? row('Years of experience', experienceYears) : ''}
        ${row('Languages known', languagesKnown.join(', '))}
        ${row('Key skills', keySkills)}
        ${row('Why apply', whyApply)}
        ${startDate ? row('Available start', startDate) : ''}
        ${linkedin ? row('LinkedIn', linkedin) : ''}
        ${company ? row('Current / last company', company) : ''}
        ${currentCtc ? row('Current CTC', currentCtc) : ''}
        ${expectedCtc ? row('Expected CTC', expectedCtc) : ''}
        ${row('Resume file', safeResumeName)}
      </table>`;

    if (skipEmailDev) {
      try {
        await prisma.companyFormSubmission.create({
          data: {
            formType: 'careers_apply',
            companySlug: null,
            sectorSlug: job.slug,
            email,
            fullName: name,
            payloadJson: JSON.stringify(payload),
            resumeData: resumeBuffer,
            resumeContentType: contentType,
            resumeDataPresent: true,
          },
        });
      } catch (dbErr) {
        console.error('[careers/apply] DB save failed', dbErr);
        return jsonRes({ message: 'Could not save application.' }, { status: 500 });
      }
      console.warn('[careers/apply] CAREERS_APPLY_DEV_NO_EMAIL: saved application without sending email.');
      return jsonRes({ ok: true }, { status: 200 });
    }

    const fromAddr = getSmtpUser();
    const transporter = createMailTransporter(CAREERS_SMTP_BACKGROUND);
    const mailOk = isLoginEmailDeliveryConfigured() && transporter != null && !!fromAddr;

    try {
      await prisma.companyFormSubmission.create({
        data: {
          formType: 'careers_apply',
          companySlug: null,
          sectorSlug: job.slug,
          email,
          fullName: name,
          payloadJson: JSON.stringify(payload),
          resumeData: resumeBuffer,
          resumeContentType: contentType,
          resumeDataPresent: true,
        },
      });
    } catch (dbErr) {
      console.error('[careers/apply] DB save failed', dbErr);
      return jsonRes({ message: 'Could not save application.' }, { status: 500 });
    }

    if (!mailOk) {
      if (isCareersDevRelaxed()) {
        console.warn(
          '[careers/apply] DEV: no SMTP; application saved only. Set EMAIL_USER + EMAIL_PASS + SMTP_* to send mail.',
        );
      } else {
        console.warn('[careers/apply] SMTP not configured; application saved — HR can see it in the dashboard.');
      }
      return jsonRes({ ok: true }, { status: 200 });
    }

    const notifyToRaw = process.env.CAREERS_ADMIN_NOTIFY_EMAIL?.trim() || fromAddr;
    const notifyTo = careersAdminRecipientForSmtp(fromAddr!, notifyToRaw);
    if (notifyTo !== notifyToRaw) {
      console.warn(`[careers/apply] Using plus-alias for applications inbox (${notifyToRaw} → ${notifyTo}).`);
    }

    const adminMail: Mail.Options = {
      from: `"DG Careers" <${fromAddr}>`,
      to: notifyTo,
      replyTo: email,
      subject: `Careers application: ${name} — ${jobTitle}`,
      attachments: [attachment],
      text: `New careers application\nJob: ${jobTitle} (${job.slug})\n\n${JSON.stringify(payload, null, 2)}`,
      html: `
        <div style="font-family:Helvetica Neue,Helvetica,Arial,sans-serif;max-width:720px;margin:0 auto;color:#333;">
          <h2 style="color:#1e3a8a;">New careers application</h2>
          <p style="color:#555;">Resume is attached to this email.</p>
          ${detailsHtml}
          <p style="margin-top:20px;font-size:12px;color:#888;">Sent from the Doddapaneni Group careers page.</p>
        </div>`,
    };

    const userMail: Mail.Options = {
      from: `"Doddapaneni Group" <${fromAddr}>`,
      to: email,
      replyTo: fromAddr!,
      subject: `We received your application — ${jobTitle}`,
      text: `Hello ${name},\n\nThank you for applying. We received your details and resume (${safeResumeName}) for: ${jobTitle}.\n\nOur team will review your application and contact you if there is a match.\n\nBest regards,\nDoddapaneni Group`,
      html: `
        <div style="font-family:Helvetica Neue,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;color:#333;line-height:1.6;">
          <h2 style="color:#1e3a8a;border-bottom:2px solid #eee;padding-bottom:10px;">Application received</h2>
          <p>Hello <strong>${esc(name)}</strong>,</p>
          <p>Thank you for applying for <strong>${esc(jobTitle)}</strong>. We received your form and resume <strong>${esc(safeResumeName)}</strong>.</p>
          <p>Our team will review your application and reach out if there is a good fit.</p>
          <div style="border-top:1px solid #eee;padding-top:16px;margin-top:20px;font-size:14px;color:#666;">
            <p style="margin:0;">Best regards,</p>
            <p style="margin:6px 0 0;font-weight:bold;color:#1e3a8a;">Doddapaneni Group</p>
          </div>
        </div>`,
    };

    scheduleCareersEmails(transporter, adminMail, userMail);

    return jsonRes({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[careers/apply]', error);
    if (isLikelyDatabaseError(error)) {
      return jsonRes(
        {
          message:
            'Could not reach the database. Check DATABASE_URL and TURSO_AUTH_TOKEN (for libsql://), and that the database is reachable.',
        },
        { status: 503 },
      );
    }
    return jsonRes({ message: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
  return handleCorsOptions(request, { methods: 'POST, OPTIONS' });
}
