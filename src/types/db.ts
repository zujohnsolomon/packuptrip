// Database types for Packuptrip. Mirrors supabase/schema.sql.
// When schema changes, update both files together (or regenerate from
// `supabase gen types typescript` once the CLI is wired up).

export type UserRole = "traveller" | "host" | "admin";

export type PackageStatus = "draft" | "live" | "archived";

export type TripStatus =
  | "draft"
  | "pending"
  | "live"
  | "completed"
  | "cancelled";

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "cancelled"
  | "refunded";

export type ItemType = "package" | "trip";

export type SubjectType = "user" | "package" | "trip";

export type ItineraryDay = {
  day: number;
  title: string;
  description: string;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  id_verified: boolean;
  role: UserRole;
  created_at: string;
};

export type Package = {
  id: string;
  title: string;
  location: string;
  days: number;
  price: number;
  description: string;
  images: string[];
  spots_total: number;
  spots_left: number;
  tags: string[];
  includes: string[];
  itinerary: ItineraryDay[];
  start_date: string;
  status: PackageStatus;
  rating_avg: number;
  review_count: number;
  created_at: string;
};

export type Trip = {
  id: string;
  host_id: string;
  title: string;
  location: string;
  days: number;
  price_per_share: number;
  description: string;
  images: string[];
  spots_total: number;
  spots_left: number;
  tags: string[];
  includes: string[];
  itinerary: ItineraryDay[];
  start_date: string;
  status: TripStatus;
  created_at: string;
};

export type Booking = {
  id: string;
  user_id: string;
  item_id: string;
  item_type: ItemType;
  base_price: number;
  service_fee: number;
  total: number;
  status: BookingStatus;
  created_at: string;
};

export type Review = {
  id: string;
  booking_id: string;
  author_id: string;
  subject_id: string;
  subject_type: SubjectType;
  rating: number;
  text: string | null;
  created_at: string;
};

export type MessageThread = {
  id: string;
  participant_a: string;
  participant_b: string;
  trip_id: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};
