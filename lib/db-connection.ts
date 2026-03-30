/** Shared state for `connectDb()` so Prisma extensions can reset after reconnect. */

export let connectOncePromise: Promise<void> | null = null;

export function setConnectOncePromise(p: Promise<void> | null): void {
  connectOncePromise = p;
}

export function resetConnectOncePromise(): void {
  connectOncePromise = null;
}
