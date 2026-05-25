// Seed data used by the home page. The /packages and /trips browse pages now
// query Supabase directly. We keep mock data here so the home page still has
// content if the DB happens to be empty.
//
// Shapes mirror src/types/db.ts so the same Card components render both.

import type { Package, Trip } from "@/types/db";
import type { TripCardHost } from "@/components/ui/TripCard";

export const featuredPackages: Package[] = [
  {
    id: "spiti-circuit",
    title: "Spiti Valley Circuit",
    location: "Himachal Pradesh",
    days: 8,
    price: 28999,
    description: "",
    images: [
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=70",
    ],
    spots_total: 10,
    spots_left: 4,
    tags: ["Mountains", "Small group"],
    includes: [],
    itinerary: [],
    start_date: "2026-07-14",
    status: "live",
    rating_avg: 4.9,
    review_count: 124,
    created_at: new Date().toISOString(),
  },
  {
    id: "kerala-backwaters",
    title: "Kerala Backwaters & Beaches",
    location: "Alleppey · Kochi · Varkala",
    days: 6,
    price: 22500,
    description: "",
    images: [
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=70",
    ],
    spots_total: 12,
    spots_left: 6,
    tags: ["Slow travel", "Food"],
    includes: [],
    itinerary: [],
    start_date: "2026-08-03",
    status: "live",
    rating_avg: 4.8,
    review_count: 89,
    created_at: new Date().toISOString(),
  },
  {
    id: "meghalaya-roots",
    title: "Meghalaya Living Roots",
    location: "Shillong · Cherrapunji",
    days: 5,
    price: 19999,
    description: "",
    images: [
      "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?auto=format&fit=crop&w=1200&q=70",
    ],
    spots_total: 8,
    spots_left: 8,
    tags: ["Nature", "Offbeat"],
    includes: [],
    itinerary: [],
    start_date: "2026-09-10",
    status: "live",
    rating_avg: 4.9,
    review_count: 67,
    created_at: new Date().toISOString(),
  },
  {
    id: "rajasthan-royal",
    title: "Royal Rajasthan: Forts & Dunes",
    location: "Jaipur · Jodhpur · Jaisalmer",
    days: 7,
    price: 31500,
    description: "",
    images: [
      "https://images.unsplash.com/photo-1477586957327-847a0f3f4fe3?auto=format&fit=crop&w=1200&q=70",
    ],
    spots_total: 14,
    spots_left: 5,
    tags: ["Heritage", "Desert"],
    includes: [],
    itinerary: [],
    start_date: "2026-10-20",
    status: "live",
    rating_avg: 4.9,
    review_count: 152,
    created_at: new Date().toISOString(),
  },
];

// Synthetic UUID-like ids for trips. host_id intentionally fake - these
// are visual stubs only; real trips are inserted via the host flow once
// it lands. /trips page queries Supabase, not this array.
const FAKE_HOST = "00000000-0000-0000-0000-000000000000";

export const featuredTrips: Trip[] = [
  {
    id: "ladakh-bike",
    host_id: FAKE_HOST,
    title: "Ladakh on bikes - looking for 2 more riders",
    location: "Leh · Pangong · Nubra",
    days: 9,
    price_per_share: 18500,
    description: "",
    images: [
      "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1200&q=70",
    ],
    spots_total: 6,
    spots_left: 2,
    tags: ["Bikers", "Adventure"],
    includes: [],
    itinerary: [],
    start_date: "2026-09-01",
    status: "live",
    created_at: new Date().toISOString(),
    rejection_reason: null,
    admin_notes: null,
    reviewed_at: null,
    reviewed_by: null,
    rating_avg: 0,
    review_count: 0,
  },
  {
    id: "rann-utsav",
    host_id: FAKE_HOST,
    title: "Rann Utsav weekend - splitting a tent",
    location: "Dhordo, Gujarat",
    days: 3,
    price_per_share: 7800,
    description: "",
    images: [
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=70",
    ],
    spots_total: 4,
    spots_left: 3,
    tags: ["Culture", "Weekend"],
    includes: [],
    itinerary: [],
    start_date: "2026-12-20",
    status: "live",
    created_at: new Date().toISOString(),
    rejection_reason: null,
    admin_notes: null,
    reviewed_at: null,
    reviewed_by: null,
    rating_avg: 0,
    review_count: 0,
  },
  {
    id: "goa-slow",
    host_id: FAKE_HOST,
    title: "Slow Goa - yoga, cafes, long mornings",
    location: "North Goa",
    days: 5,
    price_per_share: 11200,
    description: "",
    images: [
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=70",
    ],
    spots_total: 5,
    spots_left: 3,
    tags: ["Chill", "Beach"],
    includes: [],
    itinerary: [],
    start_date: "2026-11-05",
    status: "live",
    created_at: new Date().toISOString(),
    rejection_reason: null,
    admin_notes: null,
    reviewed_at: null,
    reviewed_by: null,
    rating_avg: 0,
    review_count: 0,
  },
  {
    id: "pondy-cycle",
    host_id: FAKE_HOST,
    title: "Pondicherry on cycles - French quarter & cafes",
    location: "Pondicherry · Auroville",
    days: 4,
    price_per_share: 9400,
    description: "",
    images: [
      "https://images.unsplash.com/photo-1473625247510-8ceb1760943f?auto=format&fit=crop&w=1200&q=70",
    ],
    spots_total: 4,
    spots_left: 2,
    tags: ["Slow travel", "Food"],
    includes: [],
    itinerary: [],
    start_date: "2026-10-12",
    status: "live",
    created_at: new Date().toISOString(),
    rejection_reason: null,
    admin_notes: null,
    reviewed_at: null,
    reviewed_by: null,
    rating_avg: 0,
    review_count: 0,
  },
];

export const featuredTripHosts: Record<string, TripCardHost> = {
  "ladakh-bike": {
    name: "Aarav S.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=3&w=160&h=160&q=70",
    idVerified: true,
  },
  "rann-utsav": {
    name: "Priya M.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=3&w=160&h=160&q=70",
    idVerified: true,
  },
  "goa-slow": {
    name: "Neha K.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=3&w=160&h=160&q=70",
    idVerified: false,
  },
  "pondy-cycle": {
    name: "Rohan T.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=3&w=160&h=160&q=70",
    idVerified: true,
  },
};

export const engineImages = {
  originals:
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=70",
  community:
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=70",
};

export const heroImage =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=75";

export type Testimonial = {
  quote: string;
  name: string;
  trip: string;
  avatar: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "Booked Spiti on a whim. Came back with a circle of friends I now travel with twice a year. Best decision.",
    name: "Ananya R.",
    trip: "Spiti Valley Circuit",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=3&w=200&h=200&q=70",
  },
  {
    quote:
      "Joining a community trip felt risky at first. The verification and reviews made it feel safe - and the trip itself was magic.",
    name: "Vikram J.",
    trip: "Ladakh on bikes",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=3&w=200&h=200&q=70",
  },
  {
    quote:
      "Slow Goa was exactly what the website promised. Every detail thought through, and our host was wonderful.",
    name: "Meera P.",
    trip: "Slow Goa",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=3&w=200&h=200&q=70",
  },
];
