import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// This ensures the required URL shape `/preview/[token]` works.
// The app itself renders previews under `/{locale}/preview/[token]`.
export function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  return params.then(({ slug }) => redirect(`/${routing.defaultLocale}/preview/${encodeURIComponent(slug)}`));
}

