import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Review, Trip } from "@/types/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("name, home_city, bio")
    .eq("id", id)
    .single<Pick<Profile, "name" | "home_city" | "bio">>();

  if (!data) return { title: "Host · Packuptrip" };
  return {
    title: `${data.name} · Host on Packuptrip`,
    description:
      data.bio?.slice(0, 160) ??
      `${data.name} hosts community trips on Packuptrip.`,
  };
}

type JoinerAvatar = { id: string; name: string; avatar_url: string | null };

const DEFAULT_COVER_IMAGE =
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2400&q=85";
const DEFAULT_ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85";

export default async function HostProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: auth }, { data: contactRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single<Profile>(),
    supabase.auth.getUser(),
    // Returns ONLY the contact fields the host marked public (private ones
    // come back null). Enforced server-side in the SECURITY DEFINER function.
    supabase.rpc("get_public_host_contact", { p_host_id: id }),
  ]);

  if (!profile) notFound();

  const publicContact = (contactRows?.[0] ?? null) as {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    instagram: string | null;
    website: string | null;
  } | null;

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
    .filter((trip) => trip.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const featuredTrips = (upcomingTrips.length > 0 ? upcomingTrips : trips).slice(0, 3);
  const totalHosted = trips.length;
  const tripIds = trips.map((trip) => trip.id);

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

  const reviews = (rawReviews ?? []) as (Review & {
    author: { id: string; name: string; avatar_url: string | null };
  })[];

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;

  const happyTravelersCount = tripIds.length
    ? (await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("item_id", tripIds)
        .eq("item_type", "trip")
        .eq("status", "confirmed")).count ?? 0
    : 0;

  const featuredTripIds = featuredTrips.map((trip) => trip.id);
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

  // Build the gallery. The host's own profile_gallery uploads come first;
  // trip photos are used as a graceful fallback (and to pad if the host
  // only uploaded a few personal photos). Dedupes URLs across both sources.
  const galleryImages: string[] = [];
  const seenImages = new Set<string>();

  function pushImage(image: string | null | undefined) {
    const cleanImage = image?.trim();
    if (!cleanImage) return;
    if (seenImages.has(cleanImage)) return;
    if (galleryImages.length >= 12) return;
    galleryImages.push(cleanImage);
    seenImages.add(cleanImage);
  }

  for (const image of profile.profile_gallery ?? []) pushImage(image);
  for (const trip of trips) for (const image of trip.images) pushImage(image);

  const hasPersonalGallery = (profile.profile_gallery ?? []).length > 0;
  const coverPhoto = galleryImages[0] ?? DEFAULT_COVER_IMAGE;
  const aboutFeatureImage = galleryImages[1] ?? galleryImages[0] ?? DEFAULT_ABOUT_IMAGE;
  const sidebarQuote = reviews.find((review) => review.text && review.text.length > 30);
  const memberMonth = new Date(profile.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const localTime = new Date().toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const isOwnProfile = auth.user?.id === id;
  const firstName = profile.name.split(" ")[0] || "This host";
  const aboutTitle = profile.bio
    ? "Travelling is my way of understanding life."
    : `${firstName} is getting ready to share more.`;
  const travelStyleTags =
    profile.travel_style_tags.length > 0
      ? profile.travel_style_tags
      : ["Adventure", "Culture", "Food", "Photography", "Nature"];

  return (
    <>
      <main className="flex-1 bg-[#f8f5ef] text-[#1f1b17]">
        <section className="relative isolate min-h-[600px] overflow-hidden bg-stone-200 sm:min-h-[580px] lg:h-[540px] lg:min-h-0">
          {coverPhoto ? (
            <Image
              src={coverPhoto}
              alt={`${profile.name}'s travel cover`}
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#f4eadf,#c7b8a3)]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,242,0.98)_0%,rgba(255,250,242,0.9)_34%,rgba(255,250,242,0.18)_58%,rgba(255,250,242,0.02)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(255,255,255,0.58),transparent_30%)]" />

          <div className="relative z-10 mx-auto flex max-w-[1180px] px-5 pt-12 sm:px-8 sm:pt-14 lg:pt-[56px]">
            <div className="max-w-[660px]">
              <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-[#b35a42]">
                Trip Host
              </p>
              <h1
                className="mt-5 font-serif font-semibold leading-[0.98] tracking-tight text-[#130f0c]"
                style={{
                  fontSize: "clamp(2.5rem, 4.55vw, 3.75rem)",
                  fontVariationSettings: "'opsz' 144, 'SOFT' 0",
                }}
              >
                Exploring the world.
                <br />
                <span className="italic font-medium">Sharing what matters.</span>
              </h1>
              <p className="mt-6 max-w-[360px] text-[15px] leading-7 text-stone-700">
                {profile.bio ??
                  "I am a travel lover, storyteller and adventure seeker. I host meaningful trips where connections go beyond destinations."}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] font-medium text-stone-700">
                {profile.home_city && (
                  <span className="inline-flex items-center gap-2">
                    <PinIcon size={15} />
                    {profile.home_city}
                  </span>
                )}
                <span className="hidden h-5 w-px bg-stone-500/45 sm:block" />
                <span>
                  Local time{" "}
                  <strong className="ml-1 font-semibold text-[#1f1b17]">
                    {localTime}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="absolute right-[max(1.25rem,calc((100vw-1180px)/2+2.5rem))] top-[92px] z-20 hidden w-[220px] rounded-[10px] border border-white/70 bg-white/78 p-7 shadow-[0_18px_60px_rgba(54,37,22,0.18)] backdrop-blur-md md:block">
            <StatBlock label="Trips Hosted" value={String(totalHosted)} />
            <StatBlock label="Happy Travelers" value={String(happyTravelersCount)} />
            <div>
              <div className="font-serif text-[34px] font-semibold leading-none text-[#17120f]">
                {avgRating ? avgRating.toFixed(1) : "-"}
              </div>
              <StarRow rating={avgRating ?? 0} />
              <p className="mt-2 text-xs font-semibold text-stone-700">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </p>
            </div>
          </div>

          <svg
            className="absolute inset-x-0 bottom-[-1px] z-10 h-[210px] w-full"
            preserveAspectRatio="none"
            viewBox="0 0 1440 260"
            aria-hidden
          >
            <path
              d="M0 118C170 158 318 150 451 92C562 44 628 20 721 66C822 116 872 132 1003 96C1166 51 1282 92 1440 110V260H0Z"
              fill="#f8f5ef"
            />
          </svg>

          <div className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center px-5 text-center">
            <div className="relative h-[150px] w-[150px] rounded-full bg-white p-2 shadow-[0_18px_42px_rgba(61,42,25,0.22)] sm:h-[176px] sm:w-[176px]">
              <div className="relative h-full w-full overflow-hidden rounded-full bg-stone-100">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name}
                    fill
                    unoptimized
                    sizes="204px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center font-serif text-6xl text-stone-400">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label="Save host"
                className="absolute bottom-2 right-2 grid h-11 w-11 place-items-center rounded-full border-[3px] border-white bg-[#2d5130] text-white shadow-lg transition hover:bg-[#244329]"
              >
                <StarOutlineIcon size={20} />
              </button>
            </div>
            <h2
              className="mt-4 font-serif font-semibold leading-none tracking-tight text-[#17120f]"
              style={{
                fontSize: "clamp(2.2rem, 3.7vw, 3.35rem)",
                fontVariationSettings: "'opsz' 144, 'SOFT' 0",
              }}
            >
              {profile.name}
            </h2>
            <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.28em] text-[#17120f]">
              Travel Host
            </p>
            <p className="mt-3 font-serif text-[15px] italic tracking-[0.08em] text-stone-500">
              Meet people. Share stories. Create memories.
            </p>
          </div>
        </section>

        <section className="border-b border-stone-200/80 bg-[#f8f5ef]">
          <div className="mx-auto flex max-w-[1080px] flex-col gap-5 px-5 py-5 sm:px-8 lg:flex-row lg:items-center">
            <nav className="flex flex-1 items-center gap-8 overflow-x-auto text-[14px] font-semibold text-stone-500">
              {[
                ["About", "#about"],
                ["Trips", "#trips"],
                ["Reviews", "#reviews"],
                ["Stories", "/stories"],
                ["Gallery", "#gallery"],
              ].map(([label, href], index) => (
                <a
                  key={label}
                  href={href}
                  className={`relative shrink-0 py-3 transition hover:text-[#17120f] ${
                    index === 0
                      ? "text-[#17120f] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#17120f]"
                      : ""
                  }`}
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              {isOwnProfile ? (
                <Link
                  href="/account/profile"
                  className="inline-flex h-11 items-center rounded-[8px] bg-[#2d5130] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#244329]"
                >
                  Edit profile
                </Link>
              ) : (
                <>
                  <Link
                    href={`/messages?hostId=${id}`}
                    className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#2d5130] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#244329]"
                  >
                    <PaperPlaneIcon size={15} />
                    Connect
                  </Link>
                  <Link
                    href={`/messages?hostId=${id}`}
                    className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-stone-200 bg-white px-5 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
                  >
                    <ChatBubbleIcon size={15} />
                    Message
                  </Link>
                  <button
                    type="button"
                    aria-label="More host actions"
                    className="grid h-11 w-11 place-items-center rounded-[8px] border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:bg-stone-50"
                  >
                    <DotsIcon />
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="bg-[#f8f5ef] pb-20 pt-8 sm:pb-28">
          <div className="mx-auto grid max-w-[1080px] gap-9 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
            <div className="space-y-12">
              <article id="about" className="grid gap-8 lg:grid-cols-[1fr_0.82fr] lg:items-start">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-stone-500">
                    About me
                  </p>
                  <h3
                    className="mt-5 max-w-[360px] font-serif font-semibold leading-[1.08] tracking-tight text-[#17120f]"
                    style={{
                      fontSize: "clamp(2rem, 3.2vw, 2.75rem)",
                      fontVariationSettings: "'opsz' 144, 'SOFT' 0",
                    }}
                  >
                    {aboutTitle}
                  </h3>
                  <p className="mt-6 max-w-[410px] text-[14px] leading-7 text-stone-700">
                    {profile.bio ??
                      "This host has not added a full bio yet, but their trips will tell you where their kind of travel begins."}
                  </p>
                  <div className="mt-9 flex flex-wrap gap-3">
                    {travelStyleTags.slice(0, 5).map((tag) => (
                      <StyleIcon key={tag} label={tag} />
                    ))}
                  </div>
                </div>
                <div className="relative aspect-[1.05/1] overflow-hidden rounded-[8px] bg-stone-100 shadow-[0_20px_45px_rgba(64,44,26,0.10)]">
                  {aboutFeatureImage ? (
                    <Image
                      src={aboutFeatureImage}
                      alt={`${profile.name}'s travel moment`}
                      fill
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 420px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center bg-stone-100 font-serif text-5xl text-stone-300">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </article>

              {featuredTrips.length > 0 && (
                <article id="trips">
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#2f2a25]">
                      Featured trips
                    </p>
                    <Link
                      href={`/trips?host=${id}`}
                      className="text-[13px] font-semibold text-stone-600 hover:text-[#17120f]"
                    >
                      View all trips {">"}
                    </Link>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-3">
                    {featuredTrips.map((trip) => (
                      <FeaturedTripCard
                        key={trip.id}
                        trip={trip}
                        joiners={joinersByTrip.get(trip.id) ?? []}
                        bookedCount={joinersByTrip.get(trip.id)?.length ?? 0}
                      />
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-2">
                    {[0, 1, 2, 3].map((dot) => (
                      <span
                        key={dot}
                        className={`h-1.5 w-1.5 rounded-full ${
                          dot === 0 ? "bg-stone-500" : "bg-stone-300"
                        }`}
                      />
                    ))}
                    {upcomingTrips.length > 3 && (
                      <Link
                        href={`/trips?host=${id}`}
                        aria-label="View more trips"
                        className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-white text-stone-700 shadow-sm hover:bg-stone-50"
                      >
                        <ArrowRightIcon />
                      </Link>
                    )}
                  </div>
                </article>
              )}

              <article id="reviews" className="border-t border-stone-200 pt-9">
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#2f2a25]">
                      Traveler reviews
                    </p>
                    {reviews.length > 2 && (
                      <a
                        href="#reviews"
                        className="text-[13px] font-semibold text-stone-600 hover:text-[#17120f]"
                      >
                        View all reviews {">"}
                      </a>
                    )}
                  </div>
                  <div className="grid gap-6 sm:grid-cols-[170px_1fr_1fr]">
                    <div className="rounded-[8px] border border-stone-200 bg-white p-6 text-center shadow-[0_12px_30px_rgba(64,44,26,0.05)]">
                      <div className="font-serif text-[52px] font-semibold leading-none">
                        {avgRating?.toFixed(1) ?? "-"}
                      </div>
                      <div className="mt-3 flex justify-center">
                        <StarRow rating={avgRating ?? 0} large />
                      </div>
                      <p className="mt-3 text-xs font-semibold text-stone-700">
                        ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                      </p>
                    </div>
                    {reviews.length > 0 ? (
                      reviews.slice(0, 2).map((review) => (
                        <ReviewSnippet key={review.id} review={review} />
                      ))
                    ) : (
                      <>
                        <EmptyReviewCard text="Traveler reviews will appear here after this host completes their first reviewed trip." />
                        <EmptyReviewCard text="Packuptrip publishes reviews only from people who joined a real trip." />
                      </>
                    )}
                  </div>
                </article>

              {totalHosted === 0 && reviews.length === 0 && (
                <div className="rounded-[8px] border border-stone-200 bg-white p-10 text-center shadow-[0_12px_30px_rgba(64,44,26,0.05)]">
                  <p className="font-serif text-3xl italic text-stone-400">
                    {isOwnProfile ? "Your stage is set." : "Quiet here, for now."}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-stone-500">
                    {isOwnProfile
                      ? "Post your first trip to begin filling out this page."
                      : `${firstName} has not posted any trips yet. Drop them a message.`}
                  </p>
                  {isOwnProfile && (
                    <Link
                      href="/host/new"
                      className="mt-6 inline-flex h-11 items-center rounded-[8px] bg-[#2d5130] px-6 text-sm font-bold text-white hover:bg-[#244329]"
                    >
                      Post your first trip {">"}
                    </Link>
                  )}
                </div>
              )}
            </div>

            <aside className="space-y-8 lg:pt-0">
              <div className="rounded-[8px] border border-stone-200 bg-white p-8 shadow-[0_14px_34px_rgba(64,44,26,0.06)]">
                <figure className="relative overflow-hidden pb-7">
                  <span aria-hidden className="font-serif text-6xl leading-none text-[#a4ab8d]">
                    &ldquo;
                  </span>
                  <blockquote className="-mt-2 font-serif text-[20px] leading-[1.35] text-[#322821]">
                    {sidebarQuote?.text
                      ? trimText(sidebarQuote.text, 140)
                      : "The best journeys answer questions that in the beginning you didn't even think to ask."}
                  </blockquote>
                  <StampGraphic />
                </figure>

                <div className="mt-2 space-y-6">
                  {profile.home_city && (
                    <FactRow icon={<PinIcon />} label="From" value={profile.home_city} />
                  )}
                  {profile.languages.length > 0 && (
                    <FactRow
                      icon={<ChatBubbleIcon />}
                      label="Languages"
                      value={profile.languages.join(", ")}
                    />
                  )}
                  {profile.countries_visited.length > 0 && (
                    <FactRow
                      icon={<GlobeIcon />}
                      label="Countries visited"
                      value={`${profile.countries_visited.length} ${profile.countries_visited.length === 1 ? "country" : "countries"}`}
                    />
                  )}
                  <FactRow icon={<UserIcon />} label="Member since" value={memberMonth} />
                  <FactRow icon={<ClockIcon />} label="Response rate" value="98%" />
                  <FactRow icon={<ShieldIcon />} label="Usually replies" value="within a few hours" />
                  {profile.id_verified && (
                    <FactRow icon={<ShieldIcon />} label="Identity" value="Verified" accent />
                  )}
                  {profile.host_tier === "superhost" && (
                    <FactRow icon={<StarOutlineIcon />} label="Status" value="Superhost" accent />
                  )}
                </div>

                <ConnectSection
                  hostId={id}
                  contact={publicContact}
                  firstName={firstName}
                />
              </div>

              {galleryImages.length > 0 && (
                <div id="gallery">
                  <div className="mb-4 flex items-baseline justify-between">
                    <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-stone-500">
                      Moments from the road
                    </p>
                    <span className="text-[11px] text-stone-400">
                      {hasPersonalGallery
                        ? `${galleryImages.length} ${galleryImages.length === 1 ? "photo" : "photos"}`
                        : "From trips"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {galleryImages.slice(0, 6).map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="relative aspect-square overflow-hidden rounded-[8px] bg-stone-100 shadow-[0_8px_18px_rgba(64,44,26,0.08)]"
                      >
                        <Image
                          src={image}
                          alt="Moment from the road"
                          fill
                          unoptimized
                          sizes="96px"
                          className="object-cover transition duration-500 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                  {galleryImages.length > 6 && (
                    <p className="mt-3 text-center text-[11px] text-stone-500">
                      +{galleryImages.length - 6} more
                    </p>
                  )}
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function trimText(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-6 border-b border-stone-200 pb-5 last:mb-0 last:border-0 last:pb-0">
      <div className="font-serif text-[34px] font-semibold leading-none text-[#17120f]">
        {value}
      </div>
      <p className="mt-1 text-sm font-semibold leading-tight text-stone-700">{label}</p>
    </div>
  );
}

function StarRow({ rating, large = false }: { rating: number; large?: boolean }) {
  const full = Math.round(rating);
  return (
    <div className="mt-2 flex gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          width={large ? 15 : 12}
          height={large ? 15 : 12}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={index < full ? "#16120f" : "#d6d3d1"}
          />
        </svg>
      ))}
    </div>
  );
}

function StyleIcon({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  const icon =
    normalized.includes("adventure") || normalized.includes("mountain") ? (
      <AdventureIcon />
    ) : normalized.includes("culture") ? (
      <CultureIcon />
    ) : normalized.includes("food") ? (
      <FoodIcon />
    ) : normalized.includes("photo") ? (
      <CameraIcon />
    ) : normalized.includes("nature") || normalized.includes("beach") ? (
      <LeafIcon />
    ) : (
      <SparkleIcon />
    );

  return (
    <div className="flex w-[58px] flex-col items-center text-center">
      <span className="grid h-9 w-9 place-items-center text-[#1f1b17]">{icon}</span>
      <span className="mt-2 text-[11px] font-semibold text-stone-700">{label}</span>
    </div>
  );
}

function FeaturedTripCard({
  trip,
  joiners,
  bookedCount,
}: {
  trip: Trip;
  joiners: JoinerAvatar[];
  bookedCount: number;
}) {
  const overflowCount = Math.max(0, bookedCount - 4);

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group overflow-hidden rounded-[8px] border border-stone-200 bg-white shadow-[0_16px_34px_rgba(64,44,26,0.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(64,44,26,0.16)]"
    >
      <div className="relative aspect-[1.18/1] overflow-hidden bg-stone-100">
        {trip.images[0] ? (
          <Image
            src={trip.images[0]}
            alt={trip.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 240px"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full bg-stone-200" />
        )}
        <span className="absolute left-3 top-3 rounded-[5px] bg-white px-2.5 py-1 text-[11px] font-bold text-stone-700 shadow-sm">
          Upcoming
        </span>
        <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-white drop-shadow">
          <HeartIcon />
        </span>
      </div>
      <div className="p-5">
        <h4 className="font-serif text-[19px] font-semibold leading-tight text-[#17120f]">
          {trip.title}
        </h4>
        <p className="mt-3 text-[12px] font-medium text-stone-500">
          {trip.days} {trip.days === 1 ? "day" : "days"} · {trip.location}
        </p>
        {bookedCount > 0 && (
          <div className="mt-5 flex items-center">
            <div className="flex -space-x-2">
              {joiners.slice(0, 4).map((joiner) => (
                <span
                  key={joiner.id}
                  className="relative h-7 w-7 overflow-hidden rounded-full bg-stone-100 ring-2 ring-white"
                  title={joiner.name}
                >
                  {joiner.avatar_url ? (
                    <Image
                      src={joiner.avatar_url}
                      alt={joiner.name}
                      fill
                      unoptimized
                      sizes="28px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[10px] font-bold text-stone-500">
                      {joiner.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
              ))}
            </div>
            {overflowCount > 0 && (
              <span className="ml-3 text-[13px] font-bold text-stone-700">
                +{overflowCount}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function ReviewSnippet({
  review,
}: {
  review: Review & { author: { id: string; name: string; avatar_url: string | null } };
}) {
  const date = new Date(review.created_at).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-[8px] border border-stone-200 bg-white p-6 shadow-[0_12px_30px_rgba(64,44,26,0.05)]">
      <blockquote className="text-[13px] font-semibold leading-6 text-stone-700">
        &ldquo;{trimText(review.text ?? "A thoughtful journey with a wonderful host.", 128)}&rdquo;
      </blockquote>
      <div className="mt-5 flex items-center gap-3">
        <span className="relative h-8 w-8 overflow-hidden rounded-full bg-stone-100">
          {review.author.avatar_url ? (
            <Image
              src={review.author.avatar_url}
              alt={review.author.name}
              fill
              unoptimized
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-xs font-bold text-stone-500">
              {review.author.name.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <span className="text-[12px] leading-tight">
          <strong className="block text-[#17120f]">{review.author.name}</strong>
          <span className="text-stone-500">{date}</span>
        </span>
      </div>
    </div>
  );
}

function EmptyReviewCard({ text }: { text: string }) {
  return (
    <div className="rounded-[8px] border border-dashed border-stone-200 bg-white/70 p-6 shadow-[0_12px_30px_rgba(64,44,26,0.04)]">
      <blockquote className="text-[13px] font-semibold leading-6 text-stone-500">
        &ldquo;{text}&rdquo;
      </blockquote>
      <div className="mt-5 flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-xs font-bold text-stone-400">
          P
        </span>
        <span className="text-[12px] leading-tight">
          <strong className="block text-stone-500">Packuptrip</strong>
          <span className="text-stone-400">Reviews pending</span>
        </span>
      </div>
    </div>
  );
}

function FactRow({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-1 shrink-0 text-stone-600">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[12px] font-medium leading-none text-stone-500">
          {label}
        </span>
        <strong
          className={`mt-1.5 block text-[13px] leading-5 ${
            accent ? "text-[#2d5130]" : "text-[#28231e]"
          }`}
        >
          {value}
        </strong>
      </span>
    </div>
  );
}

type PublicContact = {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
};

function ConnectSection({
  hostId,
  contact,
  firstName,
}: {
  hostId: string;
  contact: PublicContact | null;
  firstName: string;
}) {
  // `contact` already contains ONLY the public fields (the DB function masks
  // private ones to null). So we just render whatever is present.
  const channels: { key: string; label: string; href: string; icon: ReactNode }[] = [];

  if (contact?.whatsapp) {
    channels.push({
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${contact.whatsapp}`,
      icon: <WhatsAppIcon />,
    });
  }
  if (contact?.phone) {
    channels.push({
      key: "phone",
      label: "Phone",
      href: `tel:${contact.phone.replace(/\s+/g, "")}`,
      icon: <PhoneIcon />,
    });
  }
  if (contact?.email) {
    channels.push({
      key: "email",
      label: "Email",
      href: `mailto:${contact.email}`,
      icon: <MailIcon />,
    });
  }
  if (contact?.instagram) {
    channels.push({
      key: "instagram",
      label: `@${contact.instagram}`,
      href: `https://instagram.com/${contact.instagram}`,
      icon: <InstagramIcon />,
    });
  }
  if (contact?.website) {
    channels.push({
      key: "website",
      label: friendlyDomain(contact.website),
      href: contact.website,
      icon: <GlobeIcon size={18} />,
    });
  }

  return (
    <div className="mt-8 border-t border-stone-200 pt-7">
      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#2f2a25]">
        Let&apos;s connect
      </p>
      <p className="mt-4 text-[13px] leading-6 text-stone-600">
        {channels.length > 0
          ? `${firstName} is open to messages — you can also reach them on any of these:`
          : `Message ${firstName} through Packuptrip — the safest way to start a conversation.`}
      </p>

      {/* In-app message is always primary */}
      <Link
        href={`/messages?hostId=${hostId}`}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#2d5130] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#244329]"
      >
        <ChatBubbleIcon size={16} /> Message on Packuptrip
      </Link>

      {channels.length > 0 && (
        <div className="mt-4 space-y-2">
          {channels.map((c) => (
            <a
              key={c.key}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 transition-colors hover:border-stone-400 hover:text-ink"
            >
              <span className="text-stone-500">{c.icon}</span>
              <span className="flex-1 truncate">{c.label}</span>
              <ArrowUpRightIcon />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function friendlyDomain(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function StampGraphic() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 190 92"
      className="pointer-events-none absolute bottom-0 right-[-18px] h-24 w-48 text-stone-200"
    >
      <path
        d="M0 60c35-25 70 25 105 0s58-18 85-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.8"
      />
      <path
        d="M0 72c35-25 70 25 105 0s58-18 85-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.65"
      />
      <circle cx="102" cy="49" r="34" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="102" cy="49" r="26" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M88 58l14-28 16 28H88z" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChatBubbleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
    </svg>
  );
}

function UserIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ShieldIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function StarOutlineIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function PaperPlaneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function ClockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function GlobeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.15-.174.2-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-stone-400">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function AdventureIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 18l5-10 4 8 3-5 4 7H3z" />
      <path d="M8 8l2.5 3M15 11l1.5 2.5" />
    </svg>
  );
}

function CultureIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-7h6v7" />
    </svg>
  );
}

function FoodIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 2v20M5 2v5a3 3 0 006 0V2M16 2v20M19 2v8a3 3 0 01-3 3" />
    </svg>
  );
}

function CameraIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.5 19.2 3 21 8 21 13 19 17a7 7 0 01-8 3z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0l1.7 8.3L22 12l-8.3 3.7L12 24l-1.7-8.3L2 12l8.3-3.7z" />
    </svg>
  );
}
