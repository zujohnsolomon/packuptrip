import { cn } from "@/lib/utils";

type Variant = "originals" | "community" | "neutral";

const styles: Record<Variant, string> = {
  originals: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200",
  community: "bg-green-100 text-green-900 ring-1 ring-inset ring-green-200",
  neutral: "bg-stone-100 text-stone-700 ring-1 ring-inset ring-stone-200",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
