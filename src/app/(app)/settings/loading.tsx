export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse rounded bg-muted/30" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted/20" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded bg-muted/30" />
      </div>

      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`settings-skeleton-${index}`}
          className="rounded-lg border border-border/60 bg-[#242322] p-6"
        >
          <div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted/20" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-10 animate-pulse rounded bg-muted/20" />
            <div className="h-10 animate-pulse rounded bg-muted/20" />
            <div className="h-10 animate-pulse rounded bg-muted/20" />
            <div className="h-10 animate-pulse rounded bg-muted/20" />
          </div>
        </div>
      ))}
    </div>
  );
}
