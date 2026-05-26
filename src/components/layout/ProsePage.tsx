import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Shared layout for static content pages (About, Trust & Safety, Legal, etc.)
 * Gives a centred prose column with a consistent header/breadcrumb pattern.
 */
export function ProsePage({
  eyebrow,
  title,
  subtitle,
  notice,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Optional coloured notice banner — used for "draft / pending legal review" */
  notice?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        {/* Page header */}
        <div className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">
              {eyebrow}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 max-w-xl text-stone-600">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Optional notice */}
        {notice && (
          <div className="border-b border-amber-200 bg-amber-50">
            <div className="mx-auto max-w-3xl px-4 py-3 text-sm text-amber-800 sm:px-6 lg:px-8">
              {notice}
            </div>
          </div>
        )}

        {/* Prose body */}
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="prose-packup">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
