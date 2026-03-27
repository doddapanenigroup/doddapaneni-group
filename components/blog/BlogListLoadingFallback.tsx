/** Static shell while the client blog grid bundle loads. */
export default function BlogListLoadingFallback() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-blue-900 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4 text-center">
          <div className="mx-auto h-10 max-w-md animate-pulse rounded-lg bg-blue-800/50" />
          <div className="mx-auto h-6 max-w-2xl animate-pulse rounded-lg bg-blue-800/40" />
        </div>
      </section>
      <section className="bg-slate-50 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-[22rem] animate-pulse rounded-xl border border-slate-200/80 bg-white shadow-sm"
              aria-hidden
            />
          ))}
        </div>
        <p className="sr-only" role="status">
          Loading news articles
        </p>
      </section>
    </div>
  );
}
