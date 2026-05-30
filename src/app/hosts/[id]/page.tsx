import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProfileHero } from "@/components/host-profile/ProfileHero";
import { ProfileNav } from "@/components/host-profile/ProfileNav";
import { EditorialAbout } from "@/components/host-profile/EditorialAbout";
import { FeaturedTripsCarousel } from "@/components/host-profile/FeaturedTripsCarousel";
import { HostReviewsSection } from "@/components/host-profile/ReviewsSection";
import {
  HostProfileActions,
  HostProfileSidebar,
} from "@/components/host-profile/HostProfileSidebar";
import type { JoinerAvatar, PublicContact, ReviewWithAuthor } from "@/components/host-profile/types";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_PROFILE_COLUMNS } from "@/lib/supabase/queries";
import type { Profile, Trip } from "@/types/db";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2400&q=85";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  const supabase = await createClient();
  const isUuid = UUID_RE.test(slug);
  const { data } = await supabase
    .from("profiles")
    .select("name, home_city, bio")
    .eq(isUuid ? "id" : "username", slug)
    .single<Pick<Profile, "name" | "home_city" | "bio">>();

  if (!data) return { title: "Host · Packuptrip" };
  return {
    title: `${data.name} · Host on Packuptrip`,
    description:
      data.bio?.slice(0, 160) ??
      `${data.name} hosts community trips on Packuptrip.`,
  };
}

export default async function HostProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  const supabase = await createClient();

  const isUuid = UUID_RE.test(slug);
  const { data: profile } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq(isUuid ? "id" : "username", slug)
    .single<Profile>();

  if (!profile) notFound();

  if (isUuid && profile.username) {
    redirect(`/hosts/${profile.username}`);
  }

  const id = profile.id;

  const [{ data: auth }, { data: contactRows }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("get_public_host_contact", { p_host_id: id }),
  ]);

  const publicContact = (contactRows?.[0] ?? null) as PublicContact | null;

  const { data: allTrips } = await supabase
    .from("trips")
    .select("*")
    .eq("host_id", id)
    .in("status", ["live", "completed"])
    .order("start_date", { ascending: false })
    .returns<Trip[]>();

  const trips = allTrips ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const upcomingTrips = trips
    .filter((t) => t.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const featuredTrips = (upcomingTrips.length > 0 ? upcomingTrips : trips).slice(0, 6);
  const totalHosted = trips.length;
  const tripIds = trips.map((t) => t.id);

  const { data: rawReviews } = tripIds.length
    ? await supabase
        .from("reviews")
        .select("*, author:profiles!author_id(id, name, avatar_url)")
        .in("subject_id", tripIds)
        .eq("subject_type", "trip")
        .eq("reviewer_role", "joiner")
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const reviews = (rawReviews ?? []) as ReviewWithAuthor[];

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  const happyTravelersCount = tripIds.length
    ? ((await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("item_id", tripIds)
        .eq("item_type", "trip")
        .eq("status", "confirmed")).count ?? 0)
    : 0;

  const featuredTripIds = featuredTrips.map((t) => t.id);
  const joinersByTrip = new Map<string, JoinerAvatar[]>();
  if (featuredTripIds.length > 0) {
    const { data: bookingsRaw } = await supabase
      .from("bookings")
      .select("item_id, traveller:profiles!bookings_user_id_fkey(id, name, avatar_url)")
      .in("item_id", featuredTripIds)
      .eq("item_type", "trip")
      .eq("status", "confirmed");

    const bookings = (bookingsRaw ?? []) as unknown as {
      item_id: string;
      traveller: JoinerAvatar | JoinerAvatar[] | null;
    }[];

    for (const booking of bookings) {
      const traveller = Array.isArray(booking.traveller)
        ? booking.traveller[0]
        : booking.traveller;
      if (!traveller) continue;
      const existing = joinersByTrip.get(booking.item_id) ?? [];
      existing.push(traveller);
      joinersByTrip.set(booking.item_id, existing);
    }
  }

  const galleryImages: string[] = [];
  const seenImages = new Set<string>();
  function pushImage(img: string | null | undefined) {
    const c = img?.trim();
    if (!c || seenImages.has(c) || galleryImages.length >= 12) return;
    galleryImages.push(c);
    seenImages.add(c);
  }
  for (const img of profile.profile_gallery ?? []) pushImage(img);
  for (const trip of trips) for (const img of trip.images) pushImage(img);

  const coverPhoto = galleryImages[0] ?? DEFAULT_COVER;
  const isOwnProfile = auth.user?.id === id;
  const firstName = profile.name.split(" ")[0] || "This host";
  const travelStyleTags =
    profile.travel_style_tags.length > 0
      ? profile.travel_style_tags
      : ["Adventure", "Culture", "Food", "Photography", "Nature"];

  const pullQuote =
    "The best journeys answer questions that in the beginning you didn't even think to ask.";
  const portraitImage = galleryImages[1] ?? galleryImages[0] ?? null;

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f8f5ef] text-[#1f1b17]">
        <ProfileHero
          profile={profile}
          coverPhoto={coverPhoto}
          totalHosted={totalHosted}
          happyTravelersCount={happyTravelersCount}
          avgRating={avgRating}
          reviewCount={reviews.length}
        />

        <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_292px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-10">
            {/* Tabs + actions row — matches mockup */}
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <ProfileNav />
            </div>
            <div className="hidden lg:col-start-2 lg:row-start-1 lg:block lg:self-end lg:pb-1">
              <HostProfileActions hostId={id} isOwnProfile={isOwnProfile} trips={trips} hostName={profile.name} />
            </div>

            <div className="min-w-0 lg:col-start-1 lg:row-start-2">
              <div className="space-y-10 w-full">
                <EditorialAbout
                  bio={profile.bio}
                  firstName={firstName}
                  portraitImage={portraitImage}
                  travelStyleTags={travelStyleTags}
                />

                {featuredTrips.length > 0 ? (
                  <FeaturedTripsCarousel
                    trips={featuredTrips}
                    hostId={id}
                    joinersByTrip={joinersByTrip}
                  />
                ) : (
                  <div id="trips" className="scroll-mt-28 border-t border-stone-200 pt-8" aria-hidden />
                )}

                <HostReviewsSection reviews={reviews} avgRating={avgRating} />
              </div>
            </div>

            <div className="lg:col-start-2 lg:row-start-2">
              <HostProfileSidebar
                profile={profile}
                hostId={id}
                isOwnProfile={isOwnProfile}
                publicContact={publicContact}
                galleryImages={galleryImages}
                pullQuote={pullQuote}
                trips={trips}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
