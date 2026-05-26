import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PackageCard } from "@/components/ui/PackageCard";
import { Badge } from "@/components/ui/Badge";
import { FilterBar } from "@/components/browse/FilterBar";
import { listLivePackages } from "@/lib/supabase/queries";

export const metadata = {
  title: "Packuptrip Originals - curated tours",
  description:
    "Hand-crafted tour packages with vetted local guides. Browse Packuptrip Originals by destination, date, and price.",
};

type SP = {
  q?: string;
  from?: string;
  to?: string;
  max?: string;
};

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const packages = await listLivePackages({
    q: sp.q || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <section className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 lg:px-8">
          <Badge variant="originals">Packuptrip Originals</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Curated tour packages
          </h1>
          <p className="mt-2 max-w-2xl text-stone-600">
            Trips we run ourselves. Fixed dates, vetted guides, small groups.
          </p>
        </section>

        <section className="sticky top-16 z-20 mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
          <FilterBar
            action="/packages"
            accent="amber"
            defaults={{ q: sp.q, from: sp.from, to: sp.to, max: sp.max }}
          />
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-6 lg:px-8">
          {packages.length === 0 ? (
            <EmptyState
              title="No packages match those filters"
              body="Try widening the date range or removing the price cap."
            />
          ) : (
            <>
              <div className="mb-4 text-sm text-stone-500">
                Showing {packages.length} package
                {packages.length === 1 ? "" : "s"}
              </div>
              <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {packages.map((p) => (
                  <PackageCard key={p.id} pkg={p} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
      <div className="text-base font-semibold text-ink">{title}</div>
      <p className="mt-1 text-sm text-stone-600">{body}</p>
    </div>
  );
}
