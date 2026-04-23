import { getSmtpUser, isLoginEmailDeliveryConfigured } from "@/lib/email";

export type EnvCheck = {
  key: string;
  label: string;
  valid: boolean;
  severity: "required" | "recommended";
  hint?: string;
};

function isNonEmpty(v: string | undefined) {
  return !!v && v.trim().length > 0;
}

function isUrlLike(v: string | undefined) {
  if (!isNonEmpty(v)) return false;
  try {
    const u = new URL(v!);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function getEnvStatus(): {
  ok: boolean;
  checks: EnvCheck[];
  summary: { requiredInvalid: number; recommendedInvalid: number };
} {
  const checks: EnvCheck[] = [];

  // DB
  const dbUrl = (
    process.env.DATABASE_URL ||
    process.env.TURSO_DATABASE_URL ||
    ""
  ).trim();
  checks.push({
    key: "DATABASE_URL",
    label: "Database connection",
    valid: isNonEmpty(dbUrl),
    severity: "required",
    hint: "Primary: DATABASE_URL (libsql://… or file:./dev.db). Prisma CLI uses this only. TURSO_AUTH_TOKEN for remote. Optional fallback: TURSO_DATABASE_URL.",
  });

  // Auth
  checks.push({
    key: "NEXTAUTH_URL",
    label: "NextAuth base URL",
    valid: isUrlLike(process.env.NEXTAUTH_URL),
    severity: "required",
    hint: "Set NEXTAUTH_URL to your site URL (https://yourdomain.com).",
  });

  // Email/SMTP (do not expose secrets)
  const smtpUserPresent = !!getSmtpUser();
  const smtpConfigured = isLoginEmailDeliveryConfigured();
  const smtpHostPresent = isNonEmpty(process.env.SMTP_HOST);

  checks.push({
    key: "EMAIL_USER/SMTP_USER",
    label: "Email username configured",
    valid: smtpUserPresent,
    severity: "required",
    hint: "Set EMAIL_USER or SMTP_USER.",
  });

  checks.push({
    key: "EMAIL_PASS/EMAIL_PASS_B64/SMTP_PASS",
    label: "Email password configured",
    valid: smtpConfigured,
    severity: "required",
    hint: "Set EMAIL_PASS (or EMAIL_PASS_B64). If password has #, prefer base64.",
  });

  // SMTP host/port/secure are only required if using custom SMTP.
  checks.push({
    key: "SMTP_HOST",
    label: "Custom SMTP host (optional)",
    valid: !smtpHostPresent || isNonEmpty(process.env.SMTP_HOST),
    severity: "recommended",
    hint: "If using Hostinger SMTP, set SMTP_HOST, SMTP_PORT, SMTP_SECURE.",
  });

  if (smtpHostPresent) {
    const port = Number(process.env.SMTP_PORT || "");
    checks.push({
      key: "SMTP_PORT",
      label: "SMTP port",
      valid: Number.isFinite(port) && port > 0,
      severity: "required",
      hint: "Set SMTP_PORT (465 or 587).",
    });
    checks.push({
      key: "SMTP_SECURE",
      label: "SMTP secure flag",
      valid:
        process.env.SMTP_SECURE === "true" ||
        process.env.SMTP_SECURE === "false" ||
        process.env.SMTP_SECURE === "1" ||
        process.env.SMTP_SECURE === "0",
      severity: "recommended",
      hint: "Set SMTP_SECURE=true (465) or false (587).",
    });
  }

  const requiredInvalid = checks.filter((c) => c.severity === "required" && !c.valid).length;
  const recommendedInvalid = checks.filter((c) => c.severity === "recommended" && !c.valid).length;

  return {
    ok: requiredInvalid === 0,
    checks,
    summary: { requiredInvalid, recommendedInvalid },
  };
}

