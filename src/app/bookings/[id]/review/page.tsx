import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { getMyBookingWithItem, getMyReviewForBooking, submitReview } from "@/lib/supabase/queries";
import { ReviewForm } from "@/components/reviews/ReviewForm";

export const metadata = { title: "Leave a review · Packuptrip" };

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/bookings/${id}/review`);

  const res = await getMyBookingWithItem(id);
  if (!res) notFound();
  const { booking, item } = res;

  // Only confirmed/requested bookings are reviewable (not cancelled/refunded)
  if (booking.status === "cancelled" || booking.status === "refunded") {
    redirect(`/bookings/${id}`);
  }

  // Check if the trip has actually ended
  const startDate = new Date(item.item.start_date);
  const endDate = new Date(startDate.getTime() + item.item.days * 86_400_000);
  const now = new Date();
  if (now < endDate) redirect(`/bookings/${id}`);

  // 14-day review window
  const deadline = new Date(endDate.getTime() + 14 * 86_400_000);
  if (now > deadline) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-white pt-20">
          <div className="mx-auto max-w-xl px-4 py-24 text-center">
            <p className="text-2xl font-semibold text-ink">Review window closed</p>
            <p className="mt-2 text-stone-500">
              Reviews can be left up to 14 days after a trip ends.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Already reviewed?
  const existing = await getMyReviewForBooking(id, user.id);
  if (existing) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-white pt-20">
          <div className="mx-auto max-w-xl px-4 py-24 text-center">
            <div className="text-4xl">✓</div>
            <p className="mt-4 text-2xl font-semibold text-ink">Review submitted</p>
            <p className="mt-2 text-stone-500">
              {item.type === "trip"
                ? "Your review will be published once the host has also reviewed, or after 14 days."
                : "Your review is live."}
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Determine if user is the joiner or the host of a community trip
  const isHost =
    item.type === "trip" &&
    (item.item as { host_id?: string }).host_id === user.id;

  // Server action
  async function handleSubmit(formData: FormData) {
    "use server";
    const rating = Number(formData.get("rating"));
    const text = String(formData.get("text") ?? "").trim();
    const tagsRaw = formData.get("tags");
    const tags = tagsRaw ? String(tagsRaw).split(",").filter(Boolean) : [];
    const dimensionsRaw = formData.get("dimensions");
    const dimensions = dimensionsRaw ? JSON.parse(String(dimensionsRaw)) : {};

    const subjectId = isHost
      ? booking.user_id   // host reviews the joiner (user)
      : item.item.id;     // joiner reviews the trip/package

    const subjectType = isHost
      ? "user"
      : (item.type as "trip" | "package");

    const reviewerRole = isHost ? "host" : "joiner";

    const reviewDeadline = new Date(
      endDate.getTime() + 14 * 86_400_000
    ).toISOString();

    const { error } = await submitReview({
      bookingId: id,
      subjectId,
      subjectType,
      reviewerRole,
      rating,
      dimensions,
      tags,
      text,
      reviewDeadline,
    });

    if (error && error !== "already_reviewed") {
      console.error("Review submission error:", error);
    }

    redirect(`/bookings/${id}?reviewed=1`);
  }

  const tripTitle = item.item.title;
  const isPackage = item.type === "package";

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
          <div className="mb-8">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">
              {isPackage ? "Packuptrip Original" : "Community trip"}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {isHost ? "Review your joiner" : `Review your trip`}
            </h1>
            <p className="mt-1 text-stone-500">{tripTitle}</p>
          </div>

          <ReviewForm
            isHost={isHost}
            isPackage={isPackage}
            deadlineDate={deadline}
            action={handleSubmit}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
