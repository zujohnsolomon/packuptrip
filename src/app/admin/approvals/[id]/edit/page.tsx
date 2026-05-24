import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getTripForReview } from "@/lib/supabase/queries";
import { EditTripForm } from "./EditTripForm";

export const metadata = { title: "Edit trip · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

export default async function AdminEditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getTripForReview(id);
  if (!res) notFound();
  const { trip } = res;

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Edit before approving"
        title={trip.title}
        description="Clean up typos, tighten copy, or trim tags before publishing."
        actions={
          <Link
            href={`/admin/approvals/${trip.id}`}
            className="text-sm font-medium text-stone-600 hover:text-ink"
          >
            ← Back to review
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8 lg:py-10">
        <EditTripForm
          id={trip.id}
          defaults={{
            title: trip.title,
            location: trip.location,
            description: trip.description ?? "",
            includes: (trip.includes ?? []).join("\n"),
            tags: (trip.tags ?? [])
              .filter((t) => t !== "__seed_test_data")
              .join(", "),
          }}
        />
      </div>
    </>
  );
}
