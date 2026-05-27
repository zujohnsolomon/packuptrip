/** Placeholder used by upcoming admin pages until their feature ships. */
export function AdminStub({
  taskId,
  title,
  willInclude,
}: {
  taskId: string;
  title: string;
  willInclude: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-700">
          Coming with {taskId}
        </div>
        <h2 className="mt-2 text-xl font-semibold text-ink">{title}</h2>
        <ul className="mt-4 space-y-2 text-sm text-stone-600">
          {willInclude.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400"
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 text-xs text-stone-500">
          Status: scaffolded under T9.1. Functional build tracked in{" "}
          <code className="rounded bg-stone-100 px-1.5 py-0.5">tasks.md</code>{" "}
          Epic 9.
        </div>
      </div>
    </div>
  );
}
