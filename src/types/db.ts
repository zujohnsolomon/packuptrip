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

export type ReportCategory = "safety" | "harassment" | "fraud" | "other";

export type ReportStatus = "open" | "investigating" | "resolved";

export type Report = {
  id: string;
  reporter_id: string;
  subject_type: SubjectType;
  subject_id: string;
  booking_id: string | null;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
};

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
  // Moderation fields (added in v1_users_admin migration):
  suspension_reason: string | null;
  suspended_at: string | null;
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
  // Admin moderation fields (added in v1_trip_approval_queue):
  rejection_reason: string | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
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
