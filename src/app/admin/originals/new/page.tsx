import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PackageEditor, blankPackage } from "@/components/admin/PackageEditor";
import { createPackage } from "../actions";

export const metadata = { title: "New package · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

export default function NewPackagePage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Originals"
        title="New package"
        description="Curated departure operated by Packuptrip. Save as draft to keep working; switch status to Live when it's ready."
        actions={
          <Link
            href="/admin/originals"
            className="text-sm font-medium text-stone-600 hover:text-ink"
          >
            ← Back to list
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8 lg:py-10">
        <PackageEditor
          mode="create"
          defaults={blankPackage}
          action={createPackage}
          submitLabel="Create package"
          pendingLabel="Creating…"
        />
      </div>
    </>
  );
}
