type CounterKey = string;

type RequestPoint = {
  ts: number;
  ip: string;
  userId: string | null;
  path: string;
  method: string;
};

type WindowConfig = {
  bucketMs: number;
  maxBuckets: number;
};

const DEFAULT_WINDOW: WindowConfig = {
  bucketMs: 60_000, // 1 minute buckets
  maxBuckets: 60, // keep last 60 minutes
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function nowMs() {
  return Date.now();
}

function bucketStart(ts: number, bucketMs: number) {
  return Math.floor(ts / bucketMs) * bucketMs;
}

function inc(map: Map<CounterKey, number>, key: CounterKey, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function safePath(pathname: string) {
  // Normalize and keep bounded length to avoid memory attacks.
  const p = pathname.trim().slice(0, 256);
  return p || '/';
}

export function getIpFromHeaders(h: Headers): string {
  const forwarded = h.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  const ip = first || h.get('x-real-ip') || h.get('cf-connecting-ip') || 'unknown';
  return ip.slice(0, 128);
}

/**
 * In-memory request monitor.
 *
 * Notes:
 * - Per-process only (multiple server instances won’t share counts).
 * - Monitoring only; does not block.
 * - Uses fixed buckets to avoid unbounded growth.
 */
class RequestMonitor {
  private window: WindowConfig;
  private lastCleanupBucket: number | null = null;
  private bucketToIpCounts = new Map<number, Map<string, number>>();
  private bucketToUserCounts = new Map<number, Map<string, number>>();
  private bucketToPathCounts = new Map<number, Map<string, number>>();

  constructor(window: WindowConfig = DEFAULT_WINDOW) {
    this.window = window;
  }

  record(point: RequestPoint) {
    const bucket = bucketStart(point.ts, this.window.bucketMs);
    this.cleanupIfNeeded(bucket);

    // IP counts
    let ipMap = this.bucketToIpCounts.get(bucket);
    if (!ipMap) {
      ipMap = new Map();
      this.bucketToIpCounts.set(bucket, ipMap);
    }
    inc(ipMap, point.ip);

    // User counts (only when authenticated)
    if (point.userId) {
      let userMap = this.bucketToUserCounts.get(bucket);
      if (!userMap) {
        userMap = new Map();
        this.bucketToUserCounts.set(bucket, userMap);
      }
      inc(userMap, point.userId);
    }

    // Path counts (helps spot hot endpoints)
    let pathMap = this.bucketToPathCounts.get(bucket);
    if (!pathMap) {
      pathMap = new Map();
      this.bucketToPathCounts.set(bucket, pathMap);
    }
    inc(pathMap, `${point.method} ${point.path}`);
  }

  private cleanupIfNeeded(currentBucket: number) {
    if (this.lastCleanupBucket === currentBucket) return;
    this.lastCleanupBucket = currentBucket;

    const oldestAllowed = currentBucket - this.window.bucketMs * (this.window.maxBuckets - 1);
    for (const b of this.bucketToIpCounts.keys()) {
      if (b < oldestAllowed) this.bucketToIpCounts.delete(b);
    }
    for (const b of this.bucketToUserCounts.keys()) {
      if (b < oldestAllowed) this.bucketToUserCounts.delete(b);
    }
    for (const b of this.bucketToPathCounts.keys()) {
      if (b < oldestAllowed) this.bucketToPathCounts.delete(b);
    }
  }

  snapshot(args?: { windowMinutes?: number; limit?: number }) {
    const windowMinutes = clamp(args?.windowMinutes ?? 10, 1, this.window.maxBuckets);
    const limit = clamp(args?.limit ?? 20, 5, 100);

    const ts = nowMs();
    const currentBucket = bucketStart(ts, this.window.bucketMs);
    this.cleanupIfNeeded(currentBucket);

    const fromBucket = currentBucket - this.window.bucketMs * (windowMinutes - 1);

    const ipAgg = new Map<string, number>();
    const userAgg = new Map<string, number>();
    const pathAgg = new Map<string, number>();

    for (const [b, m] of this.bucketToIpCounts.entries()) {
      if (b < fromBucket) continue;
      for (const [k, v] of m.entries()) inc(ipAgg, k, v);
    }
    for (const [b, m] of this.bucketToUserCounts.entries()) {
      if (b < fromBucket) continue;
      for (const [k, v] of m.entries()) inc(userAgg, k, v);
    }
    for (const [b, m] of this.bucketToPathCounts.entries()) {
      if (b < fromBucket) continue;
      for (const [k, v] of m.entries()) inc(pathAgg, k, v);
    }

    const topIps = Array.from(ipAgg.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([ip, count]) => ({
        ip,
        count,
        perMin: Math.round((count / windowMinutes) * 10) / 10,
        suspicious: count >= windowMinutes * 120, // ~120 req/min average
      }));

    const topUsers = Array.from(userAgg.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId, count]) => ({
        userId,
        count,
        perMin: Math.round((count / windowMinutes) * 10) / 10,
        suspicious: count >= windowMinutes * 180, // authenticated users can be “spikier”
      }));

    const topPaths = Array.from(pathAgg.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ key, count, perMin: Math.round((count / windowMinutes) * 10) / 10 }));

    return {
      ts: new Date(ts).toISOString(),
      windowMinutes,
      limit,
      summary: {
        distinctIps: ipAgg.size,
        distinctUsers: userAgg.size,
      },
      topIps,
      topUsers,
      topPaths,
    };
  }
}

const globalForRequestMonitor = globalThis as unknown as { requestMonitor?: RequestMonitor };
export const requestMonitor = globalForRequestMonitor.requestMonitor ?? new RequestMonitor();
if (process.env.NODE_ENV !== 'production') globalForRequestMonitor.requestMonitor = requestMonitor;

export function recordApiRequest(args: {
  request: Request;
  userId?: string | null;
}) {
  try {
    const url = new URL(args.request.url);
    requestMonitor.record({
      ts: nowMs(),
      ip: getIpFromHeaders(args.request.headers),
      userId: args.userId ?? null,
      path: safePath(url.pathname),
      method: (args.request.method || 'GET').slice(0, 12),
    });
  } catch {
    // monitoring must never crash requests
  }
}

