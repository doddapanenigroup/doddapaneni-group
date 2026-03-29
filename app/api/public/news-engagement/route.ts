import { NextResponse } from 'next/server';
import * as z from 'zod';
import {
  createMailTransporter,
  getSmtpUser,
  isLoginEmailDeliveryConfigured,
} from '@/lib/email';
import { recordApiRequest } from '@/lib/request-monitor';

const leadSchema = z.object({
  kind: z.literal('lead'),
  articleSlug: z.string().min(1).max(200),
  articleTitle: z.string().min(1).max(500),
  articlePathname: z.string().min(1).max(500),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(80).optional(),
  company: z.string().max(200).optional(),
  message: z.string().min(5).max(8000),
});

const commentSchema = z.object({
  kind: z.literal('comment'),
  articleSlug: z.string().min(1).max(200),
  articleTitle: z.string().min(1).max(500),
  articlePathname: z.string().min(1).max(500),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  comment: z.string().min(3).max(8000),
});

const bodySchema = z.discriminatedUnion('kind', [leadSchema, commentSchema]);

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request: Request) {
  try {
    recordApiRequest({ request, userId: null });
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', errors: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;

    if (!isLoginEmailDeliveryConfigured()) {
      return NextResponse.json(
        { message: 'Email is not configured on this server.' },
        { status: 500 },
      );
    }

    const fromAddr = getSmtpUser();
    const transporter = createMailTransporter();
    if (!transporter || !fromAddr) {
      return NextResponse.json({ message: 'Email transport could not be created.' }, { status: 500 });
    }

    const articleLine = `Article: ${data.articleTitle}\nPath: ${data.articlePathname}\nSlug: ${data.articleSlug}`;

    if (data.kind === 'lead') {
      const adminText = `News — business inquiry\n\n${articleLine}\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone ?? '—'}\nCompany: ${data.company ?? '—'}\n\nMessage:\n${data.message}`;
      const adminHtml = `
        <div style="font-family: sans-serif; max-width: 640px; color: #111;">
          <h2 style="color: #1e3a8a;">News — business inquiry</h2>
          <p style="white-space: pre-wrap;">${esc(articleLine)}</p>
          <table style="border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:6px 12px 6px 0;font-weight:600;">Name</td><td>${esc(data.name)}</td></tr>
            <tr><td style="padding:6px 12px 6px 0;font-weight:600;">Email</td><td><a href="mailto:${esc(data.email)}">${esc(data.email)}</a></td></tr>
            <tr><td style="padding:6px 12px 6px 0;font-weight:600;">Phone</td><td>${esc(data.phone ?? '—')}</td></tr>
            <tr><td style="padding:6px 12px 6px 0;font-weight:600;">Company</td><td>${esc(data.company ?? '—')}</td></tr>
          </table>
          <p style="font-weight:600;">Message</p>
          <div style="background:#f3f4f6;padding:12px;border-radius:8px;white-space:pre-wrap;">${esc(data.message)}</div>
        </div>`;

      await transporter.sendMail({
        from: `"DG News — lead" <${fromAddr}>`,
        to: fromAddr,
        replyTo: data.email,
        subject: `News inquiry: ${data.name} — ${data.articleSlug}`,
        text: adminText,
        html: adminHtml,
      });
    } else {
      const adminText = `News — comment (for moderation)\n\n${articleLine}\n\nName: ${data.name}\nEmail: ${data.email}\n\nComment:\n${data.comment}`;
      const adminHtml = `
        <div style="font-family: sans-serif; max-width: 640px; color: #111;">
          <h2 style="color: #1e3a8a;">News — comment (for moderation)</h2>
          <p style="white-space: pre-wrap;">${esc(articleLine)}</p>
          <table style="border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:6px 12px 6px 0;font-weight:600;">Name</td><td>${esc(data.name)}</td></tr>
            <tr><td style="padding:6px 12px 6px 0;font-weight:600;">Email</td><td><a href="mailto:${esc(data.email)}">${esc(data.email)}</a></td></tr>
          </table>
          <p style="font-weight:600;">Comment</p>
          <div style="background:#f3f4f6;padding:12px;border-radius:8px;white-space:pre-wrap;">${esc(data.comment)}</div>
        </div>`;

      await transporter.sendMail({
        from: `"DG News — comment" <${fromAddr}>`,
        to: fromAddr,
        replyTo: data.email,
        subject: `News comment: ${data.articleSlug}`,
        text: adminText,
        html: adminHtml,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('news-engagement POST:', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
