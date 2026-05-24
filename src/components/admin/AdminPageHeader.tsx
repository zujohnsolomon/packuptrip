export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-6 py-6 lg:px-8">
        <div>
          {eyebrow && (
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              {eyebrow}
            </div>
          )}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-stone-600">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
