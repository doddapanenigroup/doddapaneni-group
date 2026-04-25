import { NextResponse } from 'next/server';
import * as z from 'zod';
import {
  createMailTransporter,
  getSmtpUser,
  isLoginEmailDeliveryConfigured,
  smtpFailureUserMessage,
} from '@/lib/email';
import { connectDb, prisma } from '@/lib/db';
import { recordApiRequest } from '@/lib/request-monitor';

const leadSchema = z.object({
  kind: z.literal('lead'),
  sectorSlug: z.string().min(1),
  sectorName: z.string().min(1),
  articleTitle: z.string().min(1),
  articleSlug: z.string().min(1),
  articlePath: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  zipCode: z.string().min(2),
  serviceType: z.string().min(1),
  dynamic: z.record(z.string(), z.string()).default({}),
  bestTimeToCall: z.string().min(1),
  preferredContactMethod: z.string().min(1),
  consentUsLead: z.boolean().default(false),
  notes: z.string().default(''),
});

const contactSchema = z.object({
  kind: z.literal('contact'),
  sectorSlug: z.string().min(1),
  sectorName: z.string().min(1),
  articleTitle: z.string().min(1),
  articleSlug: z.string().min(1),
  articlePath: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  message: z.string().min(10),
});

const requestSchema = z.discriminatedUnion('kind', [leadSchema, contactSchema]);

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function kvTableHtml(rows: Array<[string, string]>) {
  return rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;">${esc(
          k,
        )}</td><td style="padding:6px 0;">${esc(v || '-')}</td></tr>`,
    )
    .join('');
}

async function persistDoddapaneniNewsForm(payload: z.infer<typeof leadSchema> | z.infer<typeof contactSchema>) {
  await connectDb();
  const formType =
    payload.kind === 'lead' ? 'doddapaneni_news_lead' : 'doddapaneni_news_contact';
  const fullName = payload.kind === 'lead' ? payload.fullName : payload.name;
  await prisma.companyFormSubmission.create({
    data: {
      formType,
      companySlug: null,
      sectorSlug: payload.sectorSlug.trim().toLowerCase(),
      email: payload.email,
      fullName,
      payloadJson: JSON.stringify(payload),
    },
  });
}

export async function POST(request: Request) {
  try {
    recordApiRequest({ request, userId: null });
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: parsed.error.issues },
        { status: 400 },
      );
    }
    const payload = parsed.data;

    try {
      await persistDoddapaneniNewsForm(payload);
    } catch (dbErr) {
      console.error('[doddapaneni-news-forms] DB save failed', dbErr);
      return NextResponse.json({ message: 'Could not save submission.' }, { status: 500 });
    }

    const fromAddr = getSmtpUser();
    const transporter = createMailTransporter();
    const canSend =
      isLoginEmailDeliveryConfigured() && !!transporter && !!fromAddr;

    if (!canSend) {
      console.warn(
        '[doddapaneni-news-forms] Stored submission; outbound email not configured or transport unavailable.',
      );
      return NextResponse.json({ ok: true, emailSent: false }, { status: 200 });
    }

    const articleRows: Array<[string, string]> = [
      ['Sector', payload.sectorName],
      ['Article', payload.articleTitle],
      ['Article path', payload.articlePath],
      ['Article slug', payload.articleSlug],
    ];

    if (payload.kind === 'lead') {
      const dynamicRows = Object.entries(payload.dynamic).map(
        ([k, v]) => [k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()), v] as [string, string],
      );

      const rows: Array<[string, string]> = [
        ...articleRows,
        ['Full Name', payload.fullName],
        ['Email', payload.email],
        ['Phone', payload.phone],
        ['Zip Code', payload.zipCode],
        ['Service Type', payload.serviceType],
        ...dynamicRows,
        ['Best Time to Call', payload.bestTimeToCall],
        ['Preferred Contact Method', payload.preferredContactMethod],
        ['USA Consent', payload.consentUsLead ? 'Yes' : 'No'],
        ['Notes', payload.notes || '-'],
      ];

      const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
      const html = `<div style="font-family:Arial,sans-serif;max-width:700px;color:#111;">
        <h2 style="color:#1e3a8a;">News Lead Generation Submission</h2>
        <table style="border-collapse:collapse;">${kvTableHtml(rows)}</table>
      </div>`;

      try {
        await transporter.sendMail({
          from: `"DG News Lead" <${fromAddr}>`,
          to: fromAddr,
          replyTo: payload.email,
          subject: `Lead: ${payload.sectorName} - ${payload.articleSlug}`,
          text,
          html,
        });
      } catch (mailErr) {
        console.error(
          '[doddapaneni-news-forms] sendMail failed (submission stored):',
          smtpFailureUserMessage(mailErr),
        );
        return NextResponse.json({ ok: true, emailSent: false }, { status: 200 });
      }
    } else {
      const rows: Array<[string, string]> = [
        ...articleRows,
        ['Name', payload.name],
        ['Email', payload.email],
        ['Phone', payload.phone],
        ['Message', payload.message],
      ];
      const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
      const html = `<div style="font-family:Arial,sans-serif;max-width:700px;color:#111;">
        <h2 style="color:#1e3a8a;">News Contact Form Submission</h2>
        <table style="border-collapse:collapse;">${kvTableHtml(rows)}</table>
      </div>`;

      try {
        await transporter.sendMail({
          from: `"DG News Contact" <${fromAddr}>`,
          to: fromAddr,
          replyTo: payload.email,
          subject: `Contact: ${payload.sectorName} - ${payload.articleSlug}`,
          text,
          html,
        });
      } catch (mailErr) {
        console.error(
          '[doddapaneni-news-forms] sendMail failed (submission stored):',
          smtpFailureUserMessage(mailErr),
        );
        return NextResponse.json({ ok: true, emailSent: false }, { status: 200 });
      }
    }

    return NextResponse.json({ ok: true, emailSent: true }, { status: 200 });
  } catch (error) {
    console.error('doddapaneni-news-forms POST failed', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
