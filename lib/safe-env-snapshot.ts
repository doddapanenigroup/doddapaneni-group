/**
 * Read-only, non-leaking preview of select environment variables for the developer dashboard.
 * Never returns raw secret material; sensitive keys are masked.
 */

const SENSITIVE_KEY =
  /(SECRET|PASSWORD|PASS$|_PASS|_KEY$|TOKEN|PRIVATE|COOKIE|DATABASE|SMTP|EMAIL_PASS|CRON|WEBHOOK|CREDENTIAL|API_KEY|AUTH_)/i;

const INFRA_KEYS = new Set([
  'NODE_ENV',
  'VERCEL',
  'VERCEL_ENV',
  'VERCEL_URL',
  'VERCEL_REGION',
  'NEXT_RUNTIME',
  'PORT',
  'HOSTNAME',
  'CI',
  'CF_PAGES',
  'PAGES',
]);

function isSensitiveName(key: string): boolean {
  if (key === 'AUTH_TRUST_HOST' || key === 'NEXTAUTH_URL' || key === 'AUTH_URL') return false;
  if (SENSITIVE_KEY.test(key)) return true;
  if (
    key === 'DATABASE_URL' ||
    key === 'TURSO_DATABASE_URL' ||
    key === 'DIRECT_URL' ||
    key === 'POSTGRES_URL'
  ) {
    return true;
  }
  return false;
}

function displayValue(key: string, raw: string | undefined): { value: string; sensitive: boolean } {
  if (raw === undefined || raw === '') {
    return { value: '(not set)', sensitive: false };
  }
  if (isSensitiveName(key)) {
    return { value: `•••••••• (${raw.length} chars)`, sensitive: true };
  }
  if (key.startsWith('NEXT_PUBLIC_') && raw.length > 120) {
    return { value: `${raw.slice(0, 60)}… (${raw.length} chars)`, sensitive: false };
  }
  return { value: raw, sensitive: false };
}

export type SafeEnvEntry = {
  key: string;
  value: string;
  sensitive: boolean;
};

/**
 * Public / infra keys and all NEXT_PUBLIC_* (no raw secrets).
 */
export function getSafeEnvSnapshot(): SafeEnvEntry[] {
  const seen = new Set<string>();
  const out: SafeEnvEntry[] = [];
  const add = (e: SafeEnvEntry) => {
    if (seen.has(e.key)) return;
    seen.add(e.key);
    out.push(e);
  };

  for (const k of [...INFRA_KEYS].sort()) {
    const raw = process.env[k];
    const d = displayValue(k, raw);
    add({ key: k, value: d.value, sensitive: d.sensitive });
  }

  for (const k of Object.keys(process.env).sort()) {
    if (k.startsWith('NEXT_PUBLIC_')) {
      const raw = process.env[k];
      const d = displayValue(k, raw);
      add({ key: k, value: d.value, sensitive: d.sensitive });
    }
  }

  return out;
}
