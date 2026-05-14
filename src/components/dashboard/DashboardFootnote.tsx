export function DashboardFootnote() {
  return (
    <div className="flex flex-col gap-3 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>© {new Date().getFullYear()} Stasis. All rights reserved.</p>
      <p>Built for deliberate learning, progress tracking, and daily focus.</p>
    </div>
  );
}
