import { Prisma } from '@/lib/prisma-generated';

const DB_PUSH_HINT =
  'Database is missing new tables. From the project root run: npx prisma db push — then restart npm run dev.';

const GENERATE_HINT =
  'Prisma client is out of sync with the schema. Run: npx prisma generate — then restart npm run dev.';

/** User-facing hint when the DB schema wasn’t applied (common after pulling new models). */
export function prismaSchemaMissingMessage(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
    return DB_PUSH_HINT;
  }
  const msg = error instanceof Error ? error.message : String(error);
  if (/no such table/i.test(msg) && /marketing_ad/i.test(msg)) {
    return DB_PUSH_HINT;
  }
  return null;
}

/**
 * `prisma.marketingAdSlot` missing on the client usually means `lib/prisma-generated` wasn’t
 * regenerated after pulling models (or dev server started without `npm run dev` / `postinstall`).
 */
export function prismaClientOutOfSyncMessage(error: unknown): string | null {
  const msg = error instanceof Error ? error.message : String(error);
  if (/Cannot read properties of undefined/i.test(msg) && /findMany|createMany|\.create\(|\.update\(/i.test(msg)) {
    return GENERATE_HINT;
  }
  // Delegate missing often surfaces as reading findMany on undefined
  if (/reading 'findMany'|reading \"findMany\"/i.test(msg) && /undefined/i.test(msg)) {
    return GENERATE_HINT;
  }
  return null;
}

/** Prefer schema hint, then stale-client hint (used by marketer ad APIs). */
export function marketerAdApiUserMessage(error: unknown): string | null {
  return prismaSchemaMissingMessage(error) ?? prismaClientOutOfSyncMessage(error);
}
