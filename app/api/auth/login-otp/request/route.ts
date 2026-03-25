import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDb, prisma } from '@/lib/db';
import { Prisma } from '@/lib/prisma-generated';
import { getUserByLoginIdentifier } from '@/lib/get-user-for-login';
import {
  generateLoginEmailOtpCode,
  hashLoginEmailOtpCode,
  loginEmailOtpExpiresAt,
} from '@/lib/login-email-otp';
import { isLoginEmailDeliveryConfigured, sendLoginVerificationCodeEmail } from '@/lib/email';
import * as z from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  login: z.string().min(1, 'Enter email or username'),
  password: z.string().min(1),
});

/**
 * After the user enters correct email + password, create a one-time code and email it.
 */
export async function POST(request: Request) {
  try {
    if (!process.env.AUTH_SECRET?.trim()) {
      return NextResponse.json(
        {
          message:
            'AUTH_SECRET is not set on the server. Add it in your hosting environment (e.g. Heroku Config Vars), then restart the app.',
        },
        { status: 503 }
      );
    }

    if (!isLoginEmailDeliveryConfigured()) {
      return NextResponse.json(
        {
          message:
            'Email is not configured. Add EMAIL_USER and EMAIL_PASS (Gmail app password), or SMTP_HOST + SMTP_USER + SMTP_PASS, then restart the dev server.',
        },
        { status: 503 }
      );
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const login = parsed.data.login.trim();
    const password = parsed.data.password.trim();
    if (!password) return NextResponse.json({ message: 'Enter password' }, { status: 400 });

    await connectDb();
    const user = await getUserByLoginIdentifier(login);
    if (!user?.passwordHash) {
      return NextResponse.json({ message: 'Invalid email, username, or password.' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const code = generateLoginEmailOtpCode();
    const codeHash = hashLoginEmailOtpCode(user.id, code);
    const expiresAt = loginEmailOtpExpiresAt();

    // Sequential writes: more reliable across hosts than batch $transaction([...]) with some Prisma/serverless setups.
    await prisma.loginEmailOtp.deleteMany({ where: { userId: user.id } });
    await prisma.loginEmailOtp.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt,
      },
    });

    try {
      await sendLoginVerificationCodeEmail(user.email, user.name, code);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error('[login-otp/request] send mail failed:', detail, err);
      await prisma.loginEmailOtp.deleteMany({ where: { userId: user.id } });
      const devHint =
        process.env.NODE_ENV === 'development' ? ` Mail error: ${detail.slice(0, 200)}` : '';
      return NextResponse.json({ message: `Could not send verification email.${devHint}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true, codeSentTo: user.email });
  } catch (e) {
    console.error('[login-otp/request]', e);
    const msg = e instanceof Error ? e.message : String(e);
    const code =
      e && typeof e === 'object' && 'code' in e && typeof (e as { code: unknown }).code === 'string'
        ? (e as { code: string }).code
        : '';

    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          message:
            'Cannot connect to the database. Check DATABASE_URL (SSL, host, credentials) and that PostgreSQL is reachable from this server.',
        },
        { status: 503 }
      );
    }

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2021') {
        return NextResponse.json(
          {
            message:
              'Database is missing auth tables. On the server run: npx prisma db push — then restart the app.',
          },
          { status: 503 }
        );
      }
      if (e.code === 'P1001') {
        return NextResponse.json(
          {
            message:
              'Cannot reach the database. Check DATABASE_URL in hosting settings (correct host, user, password) and that PostgreSQL allows this server.',
          },
          { status: 503 }
        );
      }
    }

    if (
      /login_email_otp|LoginEmailOtp|relation .* does not exist/i.test(msg) ||
      /Unknown arg|Unknown model/i.test(msg) ||
      code === 'P2021'
    ) {
      return NextResponse.json(
        {
          message:
            'Database is missing auth tables. On the server run: npx prisma db push — then redeploy or restart the app.',
        },
        { status: 503 }
      );
    }

    if (
      code === 'P1001' ||
      /Can't reach database|connection refused|ECONNREFUSED|timeout/i.test(msg)
    ) {
      return NextResponse.json(
        {
          message:
            'Cannot reach the database. Check DATABASE_URL in hosting settings (correct host, user, password) and that PostgreSQL allows this server.',
        },
        { status: 503 }
      );
    }

    if (/AUTH_SECRET is required|AUTH_SECRET/i.test(msg)) {
      return NextResponse.json(
        {
          message:
            'AUTH_SECRET is missing or invalid on the server. Set AUTH_SECRET in your host’s environment (e.g. openssl rand -base64 32), then restart.',
        },
        { status: 503 }
      );
    }

    console.error('[login-otp/request] full error detail:', msg, e);

    return NextResponse.json(
      {
        message:
          'Sign-in service failed. Check server logs. Common fixes: set AUTH_SECRET and DATABASE_URL, run npx prisma db push on the server.',
      },
      { status: 503 }
    );
  }
}

