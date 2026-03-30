import { NextResponse } from 'next/server';
import * as z from 'zod';
import {
  createMailTransporter,
  getSmtpUser,
  isLoginEmailDeliveryConfigured,
} from '@/lib/email';
import { recordApiRequest } from '@/lib/request-monitor';
import type { LeadFormVariant } from '@/lib/company-lead-variant';

const variants = ['general', 'real_estate', 'insurance', 'health', 'digital'] as const satisfies readonly LeadFormVariant[];

const leadSchema = z
  .object({
    variant: z.enum(variants),
    companySlug: z.string().min(1),
    sectorSlug: z.string().min(1),
    companyDisplayName: z.string().optional(),
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string(),
    zipCode: z.string().min(2),
    serviceType: z.string().optional(),
    transactionType: z.string().optional(),
    budgetRange: z.string().optional(),
    propertyType: z.string().optional(),
    timeline: z.string().optional(),
    loanPreapproved: z.string().optional(),
    insuranceType: z.string().optional(),
    ageRange: z.string().optional(),
    coverageAmount: z.string().optional(),
    currentlyInsured: z.string().optional(),
    conditionInterest: z.string().optional(),
    preferredSpecialist: z.string().optional(),
    appointmentTimeframe: z.string().optional(),
    insuranceStatusHealth: z.string().optional(),
    interest: z.string().optional(),
    budget: z.string().optional(),
    companyName: z.string().optional(),
    bestTimeToCall: z.string().optional(),
    preferredContactMethod: z.string().optional(),
    comments: z.string().optional(),
    consentTcpa: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.consentTcpa) {
      ctx.addIssue({ code: 'custom', path: ['consentTcpa'], message: 'Consent required' });
    }
    const ph = data.phone.trim();
    if (data.variant !== 'digital') {
      if (ph.length < 7) {
        ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Phone required' });
      }
    } else if (ph.length > 0 && ph.length < 7) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Invalid phone' });
    }
    if (data.variant === 'general' && !data.serviceType?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['serviceType'], message: 'Required' });
    }
    if (data.variant === 'real_estate') {
      const need = ['transactionType', 'budgetRange', 'propertyType', 'timeline', 'loanPreapproved'] as const;
      for (const k of need) {
        if (!data[k]?.trim()) ctx.addIssue({ code: 'custom', path: [k], message: 'Required' });
      }
    }
    if (data.variant === 'insurance') {
      const need = ['insuranceType', 'ageRange', 'coverageAmount', 'currentlyInsured'] as const;
      for (const k of need) {
        if (!data[k]?.trim()) ctx.addIssue({ code: 'custom', path: [k], message: 'Required' });
      }
    }
    if (data.variant === 'health') {
      const need = ['conditionInterest', 'appointmentTimeframe', 'insuranceStatusHealth'] as const;
      for (const k of need) {
        if (!data[k]?.trim()) ctx.addIssue({ code: 'custom', path: [k], message: 'Required' });
      }
    }
    if (data.variant === 'digital') {
      if (!data.interest?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['interest'], message: 'Required' });
      }
      if (!data.budget?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['budget'], message: 'Required' });
      }
    }
  });

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(request: Request) {
  try {
    recordApiRequest({ request, userId: null });
    const raw = await request.json();
    const parsed = leadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', errors: parsed.error.issues }, { status: 400 });
    }
    const d = parsed.data;

    if (!isLoginEmailDeliveryConfigured()) {
      return NextResponse.json({ message: 'Email is not configured on the server.' }, { status: 500 });
    }

    const fromAddr = getSmtpUser();
    const transporter = createMailTransporter();
    if (!transporter || !fromAddr) {
      return NextResponse.json({ message: 'Email transport could not be created.' }, { status: 500 });
    }

    const lines: [string, string][] = [
      ['Variant', d.variant],
      ['Company', d.companyDisplayName || d.companySlug],
      ['Company slug', d.companySlug],
      ['Sector slug', d.sectorSlug],
      ['Full name', d.fullName],
      ['Email', d.email],
      ['Phone', d.phone || '—'],
      ['ZIP / location', d.zipCode],
    ];

    if (d.variant === 'general' && d.serviceType) lines.push(['Service type', d.serviceType]);
    if (d.variant === 'real_estate') {
      if (d.transactionType) lines.push(['Transaction', d.transactionType]);
      if (d.budgetRange) lines.push(['Budget range', d.budgetRange]);
      if (d.propertyType) lines.push(['Property type', d.propertyType]);
      if (d.timeline) lines.push(['Timeline', d.timeline]);
      if (d.loanPreapproved) lines.push(['Loan pre-approved', d.loanPreapproved]);
    }
    if (d.variant === 'insurance') {
      if (d.insuranceType) lines.push(['Insurance type', d.insuranceType]);
      if (d.ageRange) lines.push(['Age range', d.ageRange]);
      if (d.coverageAmount) lines.push(['Coverage amount', d.coverageAmount]);
      if (d.currentlyInsured) lines.push(['Currently insured', d.currentlyInsured]);
    }
    if (d.variant === 'health') {
      if (d.conditionInterest) lines.push(['Condition / interest', d.conditionInterest]);
      if (d.preferredSpecialist) lines.push(['Preferred specialist', d.preferredSpecialist]);
      if (d.appointmentTimeframe) lines.push(['Appointment timeframe', d.appointmentTimeframe]);
      if (d.insuranceStatusHealth) lines.push(['Insurance status', d.insuranceStatusHealth]);
    }
    if (d.variant === 'digital') {
      if (d.interest) lines.push(['Interest', d.interest]);
      if (d.budget) lines.push(['Budget', d.budget]);
      if (d.companyName) lines.push(['Company', d.companyName]);
    }
    if (d.bestTimeToCall?.trim()) lines.push(['Best time to call', d.bestTimeToCall]);
    if (d.preferredContactMethod?.trim()) lines.push(['Preferred contact', d.preferredContactMethod]);
    if (d.comments?.trim()) lines.push(['Comments', d.comments]);

    const textBody = ['New company lead form', '', ...lines.map(([k, v]) => `${k}: ${v}`)].join('\n');

    const rowsHtml = lines
      .map(
        ([k, v]) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;color:#555;width:180px;">${esc(k)}</td><td style="padding:8px;border-bottom:1px solid #eee;">${esc(v)}</td></tr>`,
      )
      .join('');

    const htmlBody = `
      <div style="font-family:sans-serif;max-width:640px;color:#333;">
        <h2 style="color:#1e3a8a;">New lead — ${esc(d.companyDisplayName || d.companySlug)}</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">${rowsHtml}</table>
      </div>`;

    await transporter.sendMail({
      from: `"DG Company Lead" <${fromAddr}>`,
      to: fromAddr,
      replyTo: d.email,
      subject: `Lead [${d.variant}] ${d.fullName} — ${d.companySlug}`,
      text: textBody,
      html: htmlBody,
    });

    await transporter.sendMail({
      from: `"Doddapaneni Group" <${fromAddr}>`,
      to: d.email,
      replyTo: fromAddr,
      subject: `We received your request — ${d.companyDisplayName || 'Doddapaneni Group'}`,
      text: `Hello ${d.fullName},\n\nThank you for your inquiry. Our team will review your details and contact you shortly.\n\n— Doddapaneni Group`,
      html: `<p>Hello <strong>${esc(d.fullName)}</strong>,</p><p>Thank you for your inquiry. Our team will review your details and contact you shortly.</p><p>— Doddapaneni Group</p>`,
    });

    return NextResponse.json({ message: 'ok' }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
