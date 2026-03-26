import { createHmac, timingSafeEqual } from "node:crypto";

export type PreviewTokenKind = "page" | "blog";

export type PreviewTokenPayload = {
  v: 1;
  kind: PreviewTokenKind;
  // Page tokens are locale-specific; blog tokens are not.
  locale?: string;
  slug: string;
  pageKey?: string;
  exp: number; // epoch millis
};

function base64UrlEncode(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(b64, "base64");
}

function timingSafeEqualStrings(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function createPreviewToken(payload: PreviewTokenPayload) {
  const secret = process.env.PREVIEW_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("PREVIEW_SECRET (or AUTH_SECRET) not configured");
  }

  const header = { alg: "HS256", typ: "JWT-lite" };
  const encodedHeader = base64UrlEncode(Buffer.from(JSON.stringify(header), "utf8"));
  const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${signingInput}.${signature}`;
}

export function verifyPreviewToken(token: string): PreviewTokenPayload | null {
  const secret = process.env.PREVIEW_SECRET || process.env.AUTH_SECRET;
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expected = createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  if (!timingSafeEqualStrings(expected, signature)) return null;

  let payload: PreviewTokenPayload;
  try {
    const raw = base64UrlDecode(encodedPayload).toString("utf8");
    payload = JSON.parse(raw) as PreviewTokenPayload;
  } catch {
    return null;
  }

  if (!payload || payload.v !== 1) return null;
  if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;
  if (payload.kind !== "page" && payload.kind !== "blog") return null;
  if (!payload.slug || typeof payload.slug !== "string") return null;

  return payload;
}

