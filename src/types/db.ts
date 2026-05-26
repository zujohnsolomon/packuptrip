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
  home_city: string | null;
  travel_style_tags: string[];
  languages: string[];
  id_verified: boolean;
  role: UserRole;
  created_at: string;
  // Moderation fields (added in v1_users_admin migration):
  suspension_reason: string | null;
  suspended_at: string | null;
  host_tier: "standard" | "superhost" | "flagged";
  // Referral fields (added in e1_referral_credits migration):
  referral_code: string;
  referred_by: string | null;
  referral_credits: number;
  // Plus membership (added in f3_packuptrip_plus migration):
  plus_member: boolean;
  plus_expires_at: string | null;
  // Promo credits received from being referred (fix_referral_credit_both_parties):
  promo_credits: number;
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
  rating_avg: number;
  review_count: number;
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
  credit_applied: number;
  total: number;
  status: BookingStatus;
  created_at: string;
};

export type ReviewerRole = "joiner" | "host";

/** Dimension keys for joiner → trip/package reviews */
export type JoinerDimensions = {
  accuracy: number;      // Was the listing accurate?
  communication: number; // Was the host responsive?
  experience: number;    // How was the trip itself?
  value: number;         // Worth the price?
};

/** Dimension keys for host → joiner reviews */
export type HostDimensions = {
  punctuality: number;   // Showed up on time?
  communication: number; // Easy to reach?
  vibe: number;          // Good travel companion?
};

export type ReviewDimensions = JoinerDimensions | HostDimensions;

export type Review = {
  id: string;
  booking_id: string;
  author_id: string;
  subject_id: string;
  subject_type: SubjectType;
  rating: number;
  text: string | null;
  reviewer_role: ReviewerRole | null;
  dimensions: Record<string, number>;
  tags: string[];
  is_visible: boolean;
  review_deadline: string | null;
  created_at: string;
};

/** Review with author profile attached — used for display */
export type ReviewWithAuthor = Review & {
  author: Pick<Profile, "id" | "name" | "avatar_url">;
};

export type VerificationStatus = "pending" | "approved" | "rejected";

export type IdType = "aadhaar" | "pan" | "passport" | "driving_licence";

export type VerificationRequest = {
  id: string;
  user_id: string;
  id_type: IdType;
  id_doc_path: string;
  selfie_path: string;
  status: VerificationStatus;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageThread = {
  id: string;
  participant_a: string;
  participant_b: string;
  trip_id: string | null;
  created_at: string;
};

/** Inbox row returned by get_my_threads() */
export type ThreadSummary = {
  thread_id: string;
  other_id: string;
  other_name: string;
  other_avatar: string | null;
  trip_id: string | null;
  trip_title: string | null;
  trip_image: string | null;
  last_body: string | null;
  last_at: string | null;
  last_sender: string | null;
  unread_count: number;
};

export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type TripMessage = {
  id: string;
  trip_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
};

export type NotificationType =
  | "booking_received"
  | "trip_approved"
  | "trip_cancelled"
  | "verification_approved"
  | "verification_rejected"
  | "new_message"
  | "group_message";

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
  booking_id: string | null;
  credit_amount: number;
  credited_at: string | null;
  created_at: string;
};
