// Seed data for v1 visual development. Replace with Supabase queries once the
// data model task lands. Every image is a real destination photograph — no
// flat colour placeholders allowed in the UI (see SKILL.md design system).

export type SeedPackage = {
  id: string;
  title: string;
  location: string;
  days: number;
  price: number;
  ratingAvg: number;
  reviewCount: number;
  image: string;
  spotsLeft: number;
  tags: string[];
};

export type SeedTrip = {
  id: string;
  title: string;
  location: string;
  days: number;
  pricePerShare: number;
  spotsTotal: number;
  spotsLeft: number;
  image: string;
  host: {
    name: string;
    avatar: string;
    idVerified: boolean;
    tripsHosted: number;
  };
  tags: string[];
};

export const featuredPackages: SeedPackage[] = [
  {
    id: "spiti-circuit",
    title: "Spiti Valley Circuit",
    location: "Himachal Pradesh",
    days: 8,
    price: 28999,
    ratingAvg: 4.9,
    reviewCount: 124,
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=70",
    spotsLeft: 4,
    tags: ["Mountains", "Small group"],
  },
  {
    id: "kerala-backwaters",
    title: "Kerala Backwaters & Beaches",
    location: "Alleppey · Kochi · Varkala",
    days: 6,
    price: 22500,
    ratingAvg: 4.8,
    reviewCount: 89,
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=70",
    spotsLeft: 6,
    tags: ["Slow travel", "Food"],
  },
  {
    id: "meghalaya-roots",
    title: "Meghalaya Living Roots",
    location: "Shillong · Cherrapunji",
    days: 5,
    price: 19999,
    ratingAvg: 4.9,
    reviewCount: 67,
    image:
      "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?auto=format&fit=crop&w=1200&q=70",
    spotsLeft: 8,
    tags: ["Nature", "Offbeat"],
  },
  {
    id: "rajasthan-royal",
    title: "Royal Rajasthan: Forts & Dunes",
    location: "Jaipur · Jodhpur · Jaisalmer",
    days: 7,
    price: 31500,
    ratingAvg: 4.9,
    reviewCount: 152,
    image:
      "https://images.unsplash.com/photo-1477586957327-847a0f3f4fe3?auto=format&fit=crop&w=1200&q=70",
    spotsLeft: 5,
    tags: ["Heritage", "Desert"],
  },
];

export const featuredTrips: SeedTrip[] = [
  {
    id: "ladakh-bike",
    title: "Ladakh on bikes — looking for 2 more riders",
    location: "Leh · Pangong · Nubra",
    days: 9,
    pricePerShare: 18500,
    spotsTotal: 6,
    spotsLeft: 2,
    image:
      "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1200&q=70",
    host: {
      name: "Aarav S.",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=3&w=160&h=160&q=70",
      idVerified: true,
      tripsHosted: 3,
    },
    tags: ["Bikers", "Adventure"],
  },
  {
    id: "rann-utsav",
    title: "Rann Utsav weekend — splitting a tent",
    location: "Dhordo, Gujarat",
    days: 3,
    pricePerShare: 7800,
    spotsTotal: 4,
    spotsLeft: 3,
    image:
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=70",
    host: {
      name: "Priya M.",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=3&w=160&h=160&q=70",
      idVerified: true,
      tripsHosted: 1,
    },
    tags: ["Culture", "Weekend"],
  },
  {
    id: "goa-slow",
    title: "Slow Goa — yoga, cafes, long mornings",
    location: "North Goa",
    days: 5,
    pricePerShare: 11200,
    spotsTotal: 5,
    spotsLeft: 3,
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=70",
    host: {
      name: "Neha K.",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=3&w=160&h=160&q=70",
      idVerified: false,
      tripsHosted: 0,
    },
    tags: ["Chill", "Beach"],
  },
  {
    id: "pondy-cycle",
    title: "Pondicherry on cycles — French quarter & cafes",
    location: "Pondicherry · Auroville",
    days: 4,
    pricePerShare: 9400,
    spotsTotal: 4,
    spotsLeft: 2,
    image:
      "https://images.unsplash.com/photo-1473625247510-8ceb1760943f?auto=format&fit=crop&w=1200&q=70",
    host: {
      name: "Rohan T.",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=3&w=160&h=160&q=70",
      idVerified: true,
      tripsHosted: 2,
    },
    tags: ["Slow travel", "Food"],
  },
];

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
      "Joining a community trip felt risky at first. The verification and reviews made it feel safe — and the trip itself was magic.",
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
