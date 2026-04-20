import { NextResponse } from 'next/server';
import {
  createMailTransporter,
  getSmtpUser,
  isLoginEmailDeliveryConfigured,
} from '@/lib/email';
import { connectDb, prisma } from '@/lib/db';
import { recordApiRequest } from '@/lib/request-monitor';
import { routing } from '@/i18n/routing';
import { normalizeLanguagesKnownForJob, parseApplyLanguageCodesCsv } from '@/lib/career-apply-languages';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

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

export async function POST(request: Request) {
  try {
    recordApiRequest({ request, userId: null });
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('multipart/form-data')) {
      return NextResponse.json({ message: 'Expected multipart form data.' }, { status: 400 });
    }

    const form = await request.formData();
    if (getStr(form, 'fax').length > 0) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
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
      return NextResponse.json({ message: 'Please confirm both declarations.' }, { status: 400 });
    }
    if (!jobSlug || !name || !email || !simpleEmail(email)) {
      return NextResponse.json({ message: 'Name and a valid email are required.' }, { status: 400 });
    }
    if (!positionApplied) {
      return NextResponse.json({ message: 'Position applied for is required.' }, { status: 400 });
    }
    if (keySkills.length < 10) {
      return NextResponse.json({ message: 'Please enter your key skills (at least 10 characters).' }, { status: 400 });
    }
    if (whyApply.length < 20) {
      return NextResponse.json({ message: 'Please explain why you want to apply (at least 20 characters).' }, { status: 400 });
    }

    const resume = form.get('resume');
    if (!resume || !(resume instanceof File) || resume.size === 0) {
      return NextResponse.json({ message: 'Please upload your resume (PDF or Word).' }, { status: 400 });
    }
    if (resume.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ message: 'Resume must be 5 MB or smaller.' }, { status: 400 });
    }
    if (!isAllowedResume(resume)) {
      return NextResponse.json({ message: 'Resume must be a .pdf, .doc, or .docx file.' }, { status: 400 });
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
      return NextResponse.json({ message: 'Careers are temporarily unavailable.' }, { status: 503 });
    }

    if (!job?.translations.length) {
      return NextResponse.json({ message: 'This role is not open for applications.' }, { status: 404 });
    }

    const jobLanguages = parseApplyLanguageCodesCsv(job.applyLanguageCodesCsv);
    const rawLangSelections = form
      .getAll('languagesKnown')
      .filter((v): v is string => typeof v === 'string');
    const languagesKnown = normalizeLanguagesKnownForJob(rawLangSelections, jobLanguages);
    if (languagesKnown.length === 0) {
      return NextResponse.json(
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

    if (!isLoginEmailDeliveryConfigured()) {
      console.error('[careers/apply] Email not configured');
      return NextResponse.json(
        {
          message:
            'Email is not configured on the server. Set EMAIL_USER, EMAIL_PASS, and SMTP_* if using Hostinger SMTP.',
        },
        { status: 500 },
      );
    }

    const fromAddr = getSmtpUser();
    const transporter = createMailTransporter();
    if (!transporter || !fromAddr) {
      return NextResponse.json({ message: 'Email transport could not be created.' }, { status: 500 });
    }

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

    try {
      await prisma.companyFormSubmission.create({
        data: {
          formType: 'careers_apply',
          companySlug: null,
          sectorSlug: job.slug,
          email,
          fullName: name,
          payloadJson: JSON.stringify(payload),
        },
      });
    } catch (dbErr) {
      console.error('[careers/apply] DB save failed', dbErr);
      return NextResponse.json({ message: 'Could not save application.' }, { status: 500 });
    }

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

    const userMailOptions = {
      from: `"Doddapaneni Group" <${fromAddr}>`,
      to: email,
      replyTo: fromAddr,
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

    const adminMailOptions = {
      from: `"DG Careers" <${fromAddr}>`,
      to: fromAddr,
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

    await Promise.all([transporter.sendMail(userMailOptions), transporter.sendMail(adminMailOptions)]);

    return NextResponse.json({ message: 'Application sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('[careers/apply]', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: `Could not send email: ${errMessage}. If using Gmail, use an App Password (not your normal password).` },
      { status: 500 },
    );
  }
}
