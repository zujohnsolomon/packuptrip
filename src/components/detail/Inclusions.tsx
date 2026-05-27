export function Inclusions({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        Inclusions will be listed by the host before booking.
      </p>
    );
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((it) => (
        <li
          key={it}
          className="flex items-start gap-2.5 text-sm text-stone-700"
        >
          <CheckIcon />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 shrink-0 text-yellow-400"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
