import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PackageEditor } from "@/components/admin/PackageEditor";
import { getPackageWithBookings } from "@/lib/supabase/queries";
import { updatePackage } from "../../actions";

export const metadata = { title: "Edit package · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getPackageWithBookings(id);
  if (!res) notFound();
  const { pkg } = res;

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Originals"
        title={`Edit: ${pkg.title}`}
        description="Saving updates the live listing immediately if status is Live."
        actions={
          <Link
            href={`/admin/originals/${pkg.id}`}
            className="text-sm font-medium text-stone-600 hover:text-ink"
          >
            ← Back to package
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8 lg:py-10">
        <PackageEditor
          mode="edit"
          defaults={{
            id: pkg.id,
            title: pkg.title,
            location: pkg.location,
            description: pkg.description ?? "",
            days: pkg.days,
            price: Number(pkg.price),
            start_date: pkg.start_date,
            spots_total: pkg.spots_total,
            spots_left: pkg.spots_left,
            status: pkg.status,
            images: pkg.images ?? [],
            itinerary: pkg.itinerary ?? [],
            tags: pkg.tags ?? [],
            includes: pkg.includes ?? [],
          }}
          action={updatePackage}
          submitLabel="Save changes"
          pendingLabel="Saving…"
        />
      </div>
    </>
  );
}
