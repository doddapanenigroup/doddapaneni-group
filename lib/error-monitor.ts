import { connectDb, prisma } from "@/lib/db";
import type { Role } from "@/lib/constants";
import { notifyServerErrorLogged } from "@/lib/notify";
import { isFeatureEnabled } from "@/lib/features";

type CaptureUser = { id: string; email?: string | null; role?: Role | string | null } | null | undefined;

function toSafeString(v: unknown) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (v instanceof Error) return v.message ?? "";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function getStackTrace(error: unknown) {
  if (error instanceof Error) return error.stack ?? null;
  const s = toSafeString(error);
  return s ? s.slice(0, 4000) : null;
}

export async function captureErrorToDb(args: {
  error: unknown;
  request?: Request;
  statusCode?: number;
  user?: CaptureUser;
  errorType?: string;
  context?: string;
}) {
  // Must never crash the app. Best-effort logging only.
  try {
    if (!(await isFeatureEnabled("errorMonitoring"))) {
      return;
    }
    await connectDb();

    const messageBase = toSafeString(args.error);
    const contextSuffix = args.context ? ` (${args.context})` : "";
    const message = `${messageBase}${contextSuffix}`.slice(0, 8000);

    const url = args.request?.url ? new URL(args.request.url) : null;
    const path = url?.pathname ?? null;

    const stackTrace = getStackTrace(args.error)?.slice(0, 20000) ?? null;

    await prisma.errorLog.create({
      data: {
        userId: args.user?.id ?? null,
        userEmail: (args.user?.email ?? null) as string | null,
        userRole: (args.user?.role ?? null) as string | null,
        path,
        method: args.request?.method ?? null,
        statusCode: args.statusCode ?? null,
        errorType: args.errorType ?? null,
        message,
        stackTrace,
      },
    });

    const sc = args.statusCode ?? null;
    if (sc != null && sc >= 500) {
      void notifyServerErrorLogged({
        path,
        message: message.slice(0, 500),
        statusCode: sc,
      }).catch(() => {});
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("captureErrorToDb failed:", e);
  }
}

