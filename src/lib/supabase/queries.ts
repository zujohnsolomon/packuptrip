import { createClient } from "@/lib/supabase/server";
import type {
  Booking,
  ItemType,
  Message,
  Package,
  Profile,
  Report,
  ReportCategory,
  ReportStatus,
  Review,
  ReviewWithAuthor,
  SubjectType,
  ThreadSummary,
  Trip,
  UserRole,
} from "@/types/db";

export type BrowseFilters = {
  q?: string; // destination/location free-text
  from?: string; // ISO date - start_date >= from
  to?: string; // ISO date - start_date <= to
  maxPrice?: number;
};

/** Server-side: list live packages with optional filters. RLS allows
 *  anonymous read of `status = 'live'` rows. */
export async function listLivePackages(
  filters: BrowseFilters = {},
): Promise<Package[]> {
  const supabase = await createClient();
  let query = supabase
    .from("packages")
    .select("*")
    .eq("status", "live")
    .order("start_date", { ascending: true });

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    query = query.or(`title.ilike.${pattern},location.ilike.${pattern}`);
  }
  if (filters.from) query = query.gte("start_date", filters.from);
  if (filters.to) query = query.lte("start_date", filters.to);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);

  const { data, error } = await query;
  if (error) {
    console.error("listLivePackages failed:", error);
    return [];
  }
  return (data ?? []) as Package[];
}

/** Server-side: list live community trips with optional filters. */
export async function listLiveTrips(
  filters: BrowseFilters = {},
): Promise<Trip[]> {
  const supabase = await createClient();
  let query = supabase
    .from("trips")
    .select("*")
    .eq("status", "live")
    .order("start_date", { ascending: true });

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    query = query.or(`title.ilike.${pattern},location.ilike.${pattern}`);
  }
  if (filters.from) query = query.gte("start_date", filters.from);
  if (filters.to) query = query.lte("start_date", filters.to);
  if (filters.maxPrice != null)
    query = query.lte("price_per_share", filters.maxPrice);

  const { data, error } = await query;
  if (error) {
    console.error("listLiveTrips failed:", error);
    return [];
  }
  return (data ?? []) as Trip[];
}

/** Fetch a single live package by id. Returns null if missing or not live
 *  (RLS hides drafts from anonymous visitors). */
export async function getLivePackage(id: string): Promise<Package | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("id", id)
    .eq("status", "live")
    .maybeSingle<Package>();
  if (error) {
    console.error("getLivePackage failed:", error);
    return null;
  }
  return data;
}

/** Fetch a single live trip + its host profile. Returns null if the trip
 *  is missing or not live. Host may be null if the join failed. */
export async function getLiveTrip(
  id: string,
): Promise<{ trip: Trip; host: Profile | null } | null> {
  const supabase = await createClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .eq("status", "live")
    .maybeSingle<Trip>();
  if (error || !trip) {
    if (error) console.error("getLiveTrip failed:", error);
    return null;
  }
  const { data: host } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", trip.host_id)
    .maybeSingle<Profile>();
  return { trip, host: host ?? null };
}

/** Resolve the item (package or trip) that a booking points at. */
export type BookedItem =
  | { type: "package"; item: Package }
  | { type: "trip"; item: Trip };

export async function getBookedItem(
  itemType: ItemType,
  itemId: string,
): Promise<BookedItem | null> {
  const supabase = await createClient();
  if (itemType === "package") {
    const { data } = await supabase
      .from("packages")
      .select("*")
      .eq("id", itemId)
      .maybeSingle<Package>();
    return data ? { type: "package", item: data } : null;
  }
  const { data } = await supabase
    .from("trips")
    .select("*")
    .eq("id", itemId)
    .maybeSingle<Trip>();
  return data ? { type: "trip", item: data } : null;
}

/** Bookings for the signed-in user (RLS restricts to own). Newest first. */
export async function listMyBookings(): Promise<Booking[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listMyBookings failed:", error);
    return [];
  }
  return (data ?? []) as Booking[];
}

/* -------------------------------------------------------------------------- */
/* Admin queries (gated by admin role + RLS admin policies)                   */
/* -------------------------------------------------------------------------- */

export type TripForReview = {
  trip: Trip;
  host: Profile | null;
};

/* -------------------------------------------------------------------------- */
/* Reports & safety (T9.9)                                                    */
/* -------------------------------------------------------------------------- */

export type ReportSubjectSummary = {
  type: SubjectType;
  id: string;
  title: string | null; // e.g. trip/package title or user name
};

export type AdminReportRow = {
  report: Report;
  reporter: { id: string; name: string; email: string } | null;
  subject: ReportSubjectSummary;
};

export async function getOpenReportsCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .neq("status", "resolved");
  if (error) {
    console.error("getOpenReportsCount failed:", error);
    return 0;
  }
  return count ?? 0;
}

export type AdminReportFilters = {
  status?: "any" | ReportStatus;
  category?: "any" | ReportCategory;
};

/** Admin: every report with reporter + subject info, latest first.
 *  Open (open + investigating) come before resolved within sort. */
export async function listReportsForAdmin(
  filters: AdminReportFilters = {},
): Promise<AdminReportRow[]> {
  const supabase = await createClient();

  let q = supabase.from("reports").select("*").order("created_at", {
    ascending: false,
  });
  if (filters.status && filters.status !== "any") q = q.eq("status", filters.status);
  if (filters.category && filters.category !== "any")
    q = q.eq("category", filters.category);

  const { data: reports, error } = await q;
  if (error || !reports) {
    if (error) console.error("listReportsForAdmin failed:", error);
    return [];
  }

  const reporterIds = Array.from(new Set(reports.map((r) => r.reporter_id)));
  const userSubjectIds = reports
    .filter((r) => r.subject_type === "user")
    .map((r) => r.subject_id);
  const tripSubjectIds = reports
    .filter((r) => r.subject_type === "trip")
    .map((r) => r.subject_id);
  const packageSubjectIds = reports
    .filter((r) => r.subject_type === "package")
    .map((r) => r.subject_id);

  const profileIds = Array.from(new Set([...reporterIds, ...userSubjectIds]));

  const [profilesRes, tripsRes, packagesRes] = await Promise.all([
    profileIds.length === 0
      ? Promise.resolve({ data: [] as Array<{ id: string; name: string; email: string }> })
      : supabase
          .from("profiles")
          .select("id, name, email")
          .in("id", profileIds),
    tripSubjectIds.length === 0
      ? Promise.resolve({ data: [] as Array<{ id: string; title: string }> })
      : supabase.from("trips").select("id, title").in("id", tripSubjectIds),
    packageSubjectIds.length === 0
      ? Promise.resolve({ data: [] as Array<{ id: string; title: string }> })
      : supabase.from("packages").select("id, title").in("id", packageSubjectIds),
  ]);

  const profileMap = new Map<string, { id: string; name: string; email: string }>();
  for (const p of (profilesRes.data ?? []) as Array<{
    id: string;
    name: string;
    email: string;
  }>) {
    profileMap.set(p.id, p);
  }
  const tripMap = new Map<string, string>();
  for (const t of (tripsRes.data ?? []) as Array<{ id: string; title: string }>) {
    tripMap.set(t.id, t.title);
  }
  const packageMap = new Map<string, string>();
  for (const p of (packagesRes.data ?? []) as Array<{ id: string; title: string }>) {
    packageMap.set(p.id, p.title);
  }

  return (reports as Report[]).map((report) => {
    let subjectTitle: string | null = null;
    if (report.subject_type === "user") {
      subjectTitle = profileMap.get(report.subject_id)?.name ?? null;
    } else if (report.subject_type === "trip") {
      subjectTitle = tripMap.get(report.subject_id) ?? null;
    } else if (report.subject_type === "package") {
      subjectTitle = packageMap.get(report.subject_id) ?? null;
    }
    return {
      report,
      reporter: profileMap.get(report.reporter_id) ?? null,
      subject: {
        type: report.subject_type,
        id: report.subject_id,
        title: subjectTitle,
      },
    };
  });
}

export type AdminReportDetail = {
  report: Report;
  reporter: Profile | null;
  subject: ReportSubjectSummary;
  subjectProfile: Profile | null;
  subjectTrip: Trip | null;
  subjectPackage: Package | null;
  booking: Booking | null;
};

export async function getReportForAdmin(
  id: string,
): Promise<AdminReportDetail | null> {
  const supabase = await createClient();
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .maybeSingle<Report>();
  if (!report) return null;

  const [{ data: reporter }, subject, booking] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", report.reporter_id)
      .maybeSingle<Profile>(),
    fetchSubject(supabase, report.subject_type, report.subject_id),
    report.booking_id
      ? supabase
          .from("bookings")
          .select("*")
          .eq("id", report.booking_id)
          .maybeSingle<Booking>()
      : Promise.resolve({ data: null as Booking | null }),
  ]);

  return {
    report,
    reporter: reporter ?? null,
    subject: {
      type: report.subject_type,
      id: report.subject_id,
      title:
        subject.profile?.name ??
        subject.trip?.title ??
        subject.pkg?.title ??
        null,
    },
    subjectProfile: subject.profile,
    subjectTrip: subject.trip,
    subjectPackage: subject.pkg,
    booking: booking.data ?? null,
  };
}

type SubjectFetchResult = {
  profile: Profile | null;
  trip: Trip | null;
  pkg: Package | null;
};

async function fetchSubject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  type: SubjectType,
  id: string,
): Promise<SubjectFetchResult> {
  if (type === "user") {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle<Profile>();
    return { profile: data ?? null, trip: null, pkg: null };
  }
  if (type === "trip") {
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("id", id)
      .maybeSingle<Trip>();
    return { profile: null, trip: data ?? null, pkg: null };
  }
  const { data } = await supabase
    .from("packages")
    .select("*")
    .eq("id", id)
    .maybeSingle<Package>();
  return { profile: null, trip: null, pkg: data ?? null };
}

/** Used on report-filing pages to render the subject card before submit. */
export async function lookupReportSubject(
  type: SubjectType,
  id: string,
): Promise<ReportSubjectSummary | null> {
  const supabase = await createClient();
  if (type === "user") {
    const { data } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("id", id)
      .maybeSingle();
    return data ? { type, id, title: data.name } : null;
  }
  if (type === "trip") {
    const { data } = await supabase
      .from("trips")
      .select("id, title")
      .eq("id", id)
      .maybeSingle();
    return data ? { type, id, title: data.title } : null;
  }
  const { data } = await supabase
    .from("packages")
    .select("id, title")
    .eq("id", id)
    .maybeSingle();
  return data ? { type, id, title: data.title } : null;
}

export type AdminBookingFilters = {
  q?: string;
  status?: "any" | "requested" | "confirmed" | "cancelled" | "refunded";
  itemType?: "any" | "package" | "trip";
  from?: string; // ISO date
  to?: string; // ISO date
};

export type AdminBookingListRow = {
  booking: Booking;
  user: { id: string; name: string; email: string } | null;
  itemTitle: string | null;
};

/** Admin: all bookings with filters. RLS admin-read policy covers visibility. */
export async function listBookingsForAdmin(
  filters: AdminBookingFilters = {},
): Promise<AdminBookingListRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "any") q = q.eq("status", filters.status);
  if (filters.itemType && filters.itemType !== "any")
    q = q.eq("item_type", filters.itemType);
  if (filters.from) q = q.gte("created_at", filters.from);
  if (filters.to) {
    // Inclusive upper bound - bump by 1 day so the entire `to` day is included.
    const d = new Date(filters.to);
    if (!Number.isNaN(d.getTime())) {
      d.setUTCDate(d.getUTCDate() + 1);
      q = q.lt("created_at", d.toISOString());
    }
  }

  const { data: bookings, error } = await q;
  if (error || !bookings) {
    if (error) console.error("listBookingsForAdmin failed:", error);
    return [];
  }

  // Hydrate booker profiles + item titles.
  const userIds = Array.from(new Set(bookings.map((b) => b.user_id)));
  const itemRefs = bookings.map((b) => ({ type: b.item_type, id: b.item_id }));

  const [profilesRes, titleMap] = await Promise.all([
    userIds.length === 0
      ? Promise.resolve({ data: [] as { id: string; name: string; email: string }[] })
      : supabase
          .from("profiles")
          .select("id, name, email")
          .in("id", userIds),
    hydrateItemTitles(itemRefs),
  ]);

  const userMap = new Map<string, { id: string; name: string; email: string }>();
  for (const p of (profilesRes.data ?? []) as { id: string; name: string; email: string }[]) {
    userMap.set(p.id, p);
  }

  let rows = (bookings as Booking[]).map((booking) => ({
    booking,
    user: userMap.get(booking.user_id) ?? null,
    itemTitle: titleMap.get(`${booking.item_type}:${booking.item_id}`) ?? null,
  }));

  // Text search runs in JS after hydration so we can match against
  // user name/email AND item title (which span tables).
  if (filters.q) {
    const needle = filters.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.user?.name?.toLowerCase().includes(needle) ||
        r.user?.email?.toLowerCase().includes(needle) ||
        r.itemTitle?.toLowerCase().includes(needle) ||
        r.booking.id.toLowerCase().startsWith(needle),
    );
  }
  return rows;
}

/** Admin: a single booking with everything we know about it. */
export type AdminBookingDetail = {
  booking: Booking;
  user: Profile | null;
  itemTitle: string | null;
  itemType: ItemType;
  itemId: string;
  itemImage: string | null;
  itemLocation: string | null;
  itemStartDate: string | null;
};

export async function getBookingForAdmin(
  id: string,
): Promise<AdminBookingDetail | null> {
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle<Booking>();
  if (!booking) return null;

  const [{ data: user }, item] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", booking.user_id)
      .maybeSingle<Profile>(),
    getBookedItem(booking.item_type, booking.item_id),
  ]);

  return {
    booking,
    user: user ?? null,
    itemTitle: item?.item.title ?? null,
    itemType: booking.item_type,
    itemId: booking.item_id,
    itemImage: item?.item.images?.[0] ?? null,
    itemLocation: item?.item.location ?? null,
    itemStartDate: item?.item.start_date ?? null,
  };
}

export type UserListFilters = {
  q?: string;
  role?: UserRole | "any";
  status?: "any" | "verified" | "unverified" | "suspended";
};

export type UserListRow = {
  profile: Profile;
  bookingsCount: number;
  hostedTripsCount: number;
};

/** Admin-only: searchable user list. RLS lets admins see all profiles
 *  via the existing profiles_read_all policy (which is `using (true)`). */
export async function listUsersForAdmin(
  filters: UserListFilters = {},
): Promise<UserListRow[]> {
  const supabase = await createClient();

  let q = supabase.from("profiles").select("*").order("created_at", {
    ascending: false,
  });
  if (filters.q) {
    const p = `%${filters.q}%`;
    q = q.or(`name.ilike.${p},email.ilike.${p}`);
  }
  if (filters.role && filters.role !== "any") {
    q = q.eq("role", filters.role);
  }
  if (filters.status === "verified") q = q.eq("id_verified", true);
  if (filters.status === "unverified") q = q.eq("id_verified", false);
  if (filters.status === "suspended") q = q.not("suspension_reason", "is", null);

  const { data: profiles, error } = await q;
  if (error || !profiles) {
    if (error) console.error("listUsersForAdmin failed:", error);
    return [];
  }

  // Per-user counts: batched via two aggregate queries instead of one per row.
  const ids = profiles.map((p) => p.id);
  if (ids.length === 0) {
    return [];
  }
  const [bookingsRes, tripsRes] = await Promise.all([
    supabase.from("bookings").select("user_id").in("user_id", ids),
    supabase.from("trips").select("host_id").in("host_id", ids),
  ]);

  const bookingCounts = new Map<string, number>();
  for (const b of (bookingsRes.data ?? []) as { user_id: string }[]) {
    bookingCounts.set(b.user_id, (bookingCounts.get(b.user_id) ?? 0) + 1);
  }
  const tripCounts = new Map<string, number>();
  for (const t of (tripsRes.data ?? []) as { host_id: string }[]) {
    tripCounts.set(t.host_id, (tripCounts.get(t.host_id) ?? 0) + 1);
  }

  return (profiles as Profile[]).map((profile) => ({
    profile,
    bookingsCount: bookingCounts.get(profile.id) ?? 0,
    hostedTripsCount: tripCounts.get(profile.id) ?? 0,
  }));
}

/** Admin-only: a full user view - profile + auth metadata (last sign-in,
 *  confirmed_at) + their bookings + trips they host. */
export type UserDetail = {
  profile: Profile;
  authMeta: {
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    banned_until: string | null;
  } | null;
  bookings: Array<{
    id: string;
    created_at: string;
    status: string;
    total: number;
    item_type: ItemType;
    item_id: string;
    itemTitle: string | null;
  }>;
  hostedTrips: Trip[];
};

export async function getUserDetailForAdmin(
  userId: string,
): Promise<UserDetail | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Profile>();
  if (!profile) return null;

  // auth.users - accessible via a small SECURITY DEFINER lookup OR direct
  // schema read if admin policy allows. Postgrest can't reach auth schema
  // by default, so a tiny inline RPC-less alternative: a helper function.
  // For v1 just call execute via raw SQL through a function later. Here,
  // try the simpler path: read banned_until from a view if exposed. Falling
  // back to null is fine - UI handles missing auth meta gracefully.
  const authMeta: UserDetail["authMeta"] = null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, created_at, status, total, item_type, item_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const bookingRows = (bookings ?? []) as Array<{
    id: string;
    created_at: string;
    status: string;
    total: number;
    item_type: ItemType;
    item_id: string;
  }>;

  const titleMap = await hydrateItemTitles(
    bookingRows.map((b) => ({ type: b.item_type, id: b.item_id })),
  );

  const { data: hostedTrips } = await supabase
    .from("trips")
    .select("*")
    .eq("host_id", userId)
    .order("created_at", { ascending: false });

  return {
    profile,
    authMeta,
    bookings: bookingRows.map((b) => ({
      ...b,
      total: Number(b.total),
      itemTitle: titleMap.get(`${b.item_type}:${b.item_id}`) ?? null,
    })),
    hostedTrips: (hostedTrips ?? []) as Trip[],
  };
}

export type PackageWithStats = {
  pkg: Package;
  bookingsCount: number;
  revenue: number;
};

/** Admin-only: every package across every status, with booking counts +
 *  revenue per package. Used by the Originals list. */
export async function listAllPackagesForAdmin(): Promise<PackageWithStats[]> {
  const supabase = await createClient();
  const [{ data: packages }, { data: bookings }] = await Promise.all([
    supabase.from("packages").select("*").order("start_date", { ascending: true }),
    supabase
      .from("bookings")
      .select("item_id, total")
      .eq("item_type", "package"),
  ]);

  const stats = new Map<string, { count: number; revenue: number }>();
  for (const b of (bookings ?? []) as { item_id: string; total: number }[]) {
    const cur = stats.get(b.item_id) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += Number(b.total);
    stats.set(b.item_id, cur);
  }

  return ((packages ?? []) as Package[]).map((pkg) => {
    const s = stats.get(pkg.id) ?? { count: 0, revenue: 0 };
    return { pkg, bookingsCount: s.count, revenue: s.revenue };
  });
}

/** Admin-only: a single package with its bookings (each booking joined to
 *  the booker's profile so we can show traveller name + email). */
export type AdminBookingRow = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  user: { id: string; name: string; email: string } | null;
};

export async function getPackageWithBookings(id: string): Promise<{
  pkg: Package;
  bookings: AdminBookingRow[];
} | null> {
  const supabase = await createClient();
  const { data: pkg } = await supabase
    .from("packages")
    .select("*")
    .eq("id", id)
    .maybeSingle<Package>();
  if (!pkg) return null;

  const { data: rows } = await supabase
    .from("bookings")
    .select("id, created_at, status, total, user_id")
    .eq("item_type", "package")
    .eq("item_id", id)
    .order("created_at", { ascending: false });

  const bookings = (rows ?? []) as Array<{
    id: string;
    created_at: string;
    status: string;
    total: number;
    user_id: string;
  }>;

  const userMap = new Map<string, { id: string; name: string; email: string }>();
  if (bookings.length > 0) {
    const userIds = Array.from(new Set(bookings.map((b) => b.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);
    for (const p of (profiles ?? []) as { id: string; name: string; email: string }[]) {
      userMap.set(p.id, p);
    }
  }

  return {
    pkg,
    bookings: bookings.map((b) => ({
      id: b.id,
      created_at: b.created_at,
      status: b.status,
      total: Number(b.total),
      user: userMap.get(b.user_id) ?? null,
    })),
  };
}

/** Trips waiting on admin review (status='pending'), oldest first. */
export async function listPendingTrips(): Promise<TripForReview[]> {
  const supabase = await createClient();
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error || !trips) {
    if (error) console.error("listPendingTrips failed:", error);
    return [];
  }
  const hostIds = Array.from(new Set(trips.map((t) => t.host_id)));
  const hostMap = new Map<string, Profile>();
  if (hostIds.length > 0) {
    const { data: hosts } = await supabase
      .from("profiles")
      .select("*")
      .in("id", hostIds);
    for (const h of (hosts ?? []) as Profile[]) hostMap.set(h.id, h);
  }
  return (trips as Trip[]).map((trip) => ({
    trip,
    host: hostMap.get(trip.host_id) ?? null,
  }));
}

/** Fetch a single trip + host for the admin review view. Works for any
 *  status (admin RLS read policy covers it). */
export async function getTripForReview(
  id: string,
): Promise<TripForReview | null> {
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .maybeSingle<Trip>();
  if (!trip) return null;
  const { data: host } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", trip.host_id)
    .maybeSingle<Profile>();
  return { trip, host: host ?? null };
}

export type AdminMetrics = {
  totalBookings: number;
  bookingsLast7d: number;
  bookingsLast30d: number;
  grossRevenue: number;
  revenueLast30d: number;
  activePackages: number;
  activeTrips: number;
  pendingTrips: number;
  newSignups7d: number;
  newSignups30d: number;
  totalUsers: number;
  revenueSplit: { originals: number; community: number };
};

export type AdminActivityItem = {
  kind: "booking" | "signup";
  id: string;
  timestamp: string;
  who: string;
  description: string;
  href?: string;
  amount?: number;
};

/** Pull every number the Overview dashboard needs, in parallel. Safe to call
 *  only from admin-gated pages. */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = await createClient();
  const day7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const day30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const head = { count: "exact" as const, head: true };

  const [
    bookingsAll,
    bookings7d,
    bookings30d,
    packagesLive,
    tripsLive,
    tripsPending,
    signups7d,
    signups30d,
    usersAll,
    revenueAllRows,
    revenue30dRows,
  ] = await Promise.all([
    supabase.from("bookings").select("id", head),
    supabase.from("bookings").select("id", head).gte("created_at", day7),
    supabase.from("bookings").select("id", head).gte("created_at", day30),
    supabase.from("packages").select("id", head).eq("status", "live"),
    supabase.from("trips").select("id", head).eq("status", "live"),
    supabase.from("trips").select("id", head).eq("status", "pending"),
    supabase.from("profiles").select("id", head).gte("created_at", day7),
    supabase.from("profiles").select("id", head).gte("created_at", day30),
    supabase.from("profiles").select("id", head),
    supabase.from("bookings").select("total, item_type"),
    supabase.from("bookings").select("total").gte("created_at", day30),
  ]);

  const all = (revenueAllRows.data ?? []) as { total: number; item_type: string }[];
  const last30 = (revenue30dRows.data ?? []) as { total: number }[];
  const grossRevenue = all.reduce((s, b) => s + Number(b.total), 0);
  const revenueLast30d = last30.reduce((s, b) => s + Number(b.total), 0);
  const originals = all
    .filter((b) => b.item_type === "package")
    .reduce((s, b) => s + Number(b.total), 0);
  const community = all
    .filter((b) => b.item_type === "trip")
    .reduce((s, b) => s + Number(b.total), 0);

  return {
    totalBookings: bookingsAll.count ?? 0,
    bookingsLast7d: bookings7d.count ?? 0,
    bookingsLast30d: bookings30d.count ?? 0,
    grossRevenue,
    revenueLast30d,
    activePackages: packagesLive.count ?? 0,
    activeTrips: tripsLive.count ?? 0,
    pendingTrips: tripsPending.count ?? 0,
    newSignups7d: signups7d.count ?? 0,
    newSignups30d: signups30d.count ?? 0,
    totalUsers: usersAll.count ?? 0,
    revenueSplit: { originals, community },
  };
}

/** Recent platform activity: latest bookings + signups, merged + sorted. */
export async function getAdminRecentActivity(
  limit = 10,
): Promise<AdminActivityItem[]> {
  const supabase = await createClient();

  const [bookingsRes, signupsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, created_at, total, item_type, item_id, user_id")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("profiles")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const bookings = (bookingsRes.data ?? []) as Array<{
    id: string;
    created_at: string;
    total: number;
    item_type: ItemType;
    item_id: string;
    user_id: string;
  }>;
  const signups = (signupsRes.data ?? []) as Array<{
    id: string;
    name: string;
    created_at: string;
  }>;

  // Hydrate booker names + item titles for the recent bookings, in parallel.
  const [bookerProfiles, itemTitles] = await Promise.all([
    bookings.length === 0
      ? Promise.resolve(new Map<string, string>())
      : supabase
          .from("profiles")
          .select("id, name")
          .in("id", Array.from(new Set(bookings.map((b) => b.user_id))))
          .then(({ data }) => {
            const m = new Map<string, string>();
            for (const row of (data ?? []) as { id: string; name: string }[]) {
              m.set(row.id, row.name);
            }
            return m;
          }),
    hydrateItemTitles(bookings.map((b) => ({ type: b.item_type, id: b.item_id }))),
  ]);

  const bookingItems: AdminActivityItem[] = bookings.map((b) => ({
    kind: "booking",
    id: `b-${b.id}`,
    timestamp: b.created_at,
    who: bookerProfiles.get(b.user_id) ?? "Someone",
    description: `booked ${itemTitles.get(`${b.item_type}:${b.item_id}`) ?? "a trip"}`,
    href: `/bookings/${b.id}`,
    amount: Number(b.total),
  }));

  const signupItems: AdminActivityItem[] = signups.map((s) => ({
    kind: "signup",
    id: `s-${s.id}`,
    timestamp: s.created_at,
    who: s.name,
    description: "joined Packuptrip",
  }));

  return [...bookingItems, ...signupItems]
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, limit);
}

async function hydrateItemTitles(
  refs: Array<{ type: ItemType; id: string }>,
): Promise<Map<string, string>> {
  const supabase = await createClient();
  const m = new Map<string, string>();
  if (refs.length === 0) return m;

  const pkgIds = refs.filter((r) => r.type === "package").map((r) => r.id);
  const tripIds = refs.filter((r) => r.type === "trip").map((r) => r.id);

  const [pkgs, trips] = await Promise.all([
    pkgIds.length
      ? supabase.from("packages").select("id, title").in("id", pkgIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    tripIds.length
      ? supabase.from("trips").select("id, title").in("id", tripIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  for (const p of (pkgs.data ?? []) as { id: string; title: string }[]) {
    m.set(`package:${p.id}`, p.title);
  }
  for (const t of (trips.data ?? []) as { id: string; title: string }[]) {
    m.set(`trip:${t.id}`, t.title);
  }
  return m;
}

/** Fetch a single booking belonging to the signed-in user, plus its item. */
export async function getMyBookingWithItem(
  bookingId: string,
): Promise<{ booking: Booking; item: BookedItem } | null> {
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle<Booking>();
  if (!booking) return null;
  const item = await getBookedItem(booking.item_type, booking.item_id);
  if (!item) return null;
  return { booking, item };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reviews
// ─────────────────────────────────────────────────────────────────────────────

/** Visible reviews for a trip or package listing, newest first. */
export async function getListingReviews(
  subjectType: "trip" | "package",
  subjectId: string,
): Promise<ReviewWithAuthor[]> {
  const supabase = await createClient();
  // Sweep expired deadlines so this page always reflects the latest state
  await supabase.rpc("reveal_expired_reviews");

  const { data, error } = await supabase
    .from("reviews")
    .select("*, author:profiles(id, name, avatar_url)")
    .eq("subject_type", subjectType)
    .eq("subject_id", subjectId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getListingReviews failed:", error);
    return [];
  }
  return (data ?? []) as unknown as ReviewWithAuthor[];
}

/** Check whether the signed-in user has already left a review for a booking. */
export async function getMyReviewForBooking(
  bookingId: string,
  authorId: string,
): Promise<Review | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("author_id", authorId)
    .maybeSingle<Review>();
  return data ?? null;
}

export type SubmitReviewPayload = {
  bookingId: string;
  subjectId: string;
  subjectType: "user" | "trip" | "package";
  reviewerRole: "joiner" | "host";
  rating: number;
  dimensions: Record<string, number>;
  tags: string[];
  text: string;
  /** ISO string — trip end date + 14 days */
  reviewDeadline: string;
};

/** Insert a review and call the reveal function. Server action only. */
export async function submitReview(
  payload: SubmitReviewPayload,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error: insertError } = await supabase.from("reviews").insert({
    booking_id: payload.bookingId,
    author_id: user.id,
    subject_id: payload.subjectId,
    subject_type: payload.subjectType,
    rating: payload.rating,
    text: payload.text || null,
    reviewer_role: payload.reviewerRole,
    dimensions: payload.dimensions,
    tags: payload.tags,
    is_visible: false,
    review_deadline: payload.reviewDeadline,
  });

  if (insertError) {
    if (insertError.code === "23505") return { error: "already_reviewed" };
    console.error("submitReview failed:", insertError);
    return { error: insertError.message };
  }

  // Attempt to reveal — doesn't fail the whole request if it errors
  await supabase.rpc("check_and_reveal_reviews", {
    p_booking_id: payload.bookingId,
  });

  return { error: null };
}




// ─────────────────────────────────────────────────────────────────────────────
// Messaging
// ─────────────────────────────────────────────────────────────────────────────

/** All threads for the signed-in user with last message + unread count. */
export async function getMyThreads(): Promise<ThreadSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.rpc("get_my_threads", {
    p_user_id: user.id,
  });
  if (error) { console.error("getMyThreads:", error); return []; }
  return (data ?? []) as ThreadSummary[];
}

/** Messages in a thread, oldest first (initial load). */
export async function getThreadMessages(threadId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) { console.error("getThreadMessages:", error); return []; }
  return (data ?? []) as Message[];
}

/** Thread metadata + both participant profiles. */
export async function getThreadWithParticipants(threadId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("message_threads")
    .select("*, participant_a_profile:profiles!message_threads_participant_a_fkey(id,name,avatar_url), participant_b_profile:profiles!message_threads_participant_b_fkey(id,name,avatar_url), trip:trips(id,title,images)")
    .eq("id", threadId)
    .maybeSingle();
  if (error) { console.error("getThreadWithParticipants:", error); return null; }
  return data;
}

/** Create or fetch a thread between two users on a trip. Returns thread ID. */
export async function getOrCreateThread(
  otherUserId: string,
  tripId: string | null,
): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.rpc("get_or_create_thread", {
    p_a: user.id,
    p_b: otherUserId,
    p_trip: tripId ?? null,
  });
  if (error) { console.error("getOrCreateThread:", error); return null; }
  return data as string;
}

/** Mark all unread messages in a thread as read. */
export async function markThreadRead(threadId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc("mark_thread_read", {
    p_thread_id: threadId,
    p_user_id: user.id,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin — Community Trips (T9.5)
// ─────────────────────────────────────────────────────────────────────────────

export type AdminTripListRow = {
  trip: Trip;
  host: { id: string; name: string; email: string; avatar_url: string | null } | null;
};

export async function listAllTripsForAdmin(filters: {
  q?: string;
  status?: string;
} = {}): Promise<AdminTripListRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("trips")
    .select("*, host:profiles!trips_host_id_fkey(id,name,email,avatar_url)")
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "any") q = q.eq("status", filters.status);
  if (filters.q) {
    const p = `%${filters.q}%`;
    q = q.or(`title.ilike.${p},location.ilike.${p}`);
  }

  const { data, error } = await q;
  if (error) { console.error("listAllTripsForAdmin:", error); return []; }
  return (data ?? []).map((row: any) => ({ trip: row as Trip, host: row.host ?? null }));
}

export async function adminSetTripStatus(
  tripId: string,
  status: "live" | "pending" | "cancelled",
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("trips").update({ status }).eq("id", tripId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin — Hosts (T9.7)
// ─────────────────────────────────────────────────────────────────────────────

export type AdminHostListRow = {
  profile: Profile;
  liveTrips: number;
  totalTrips: number;
  ratingAvg: number;
};

export async function listHostsForAdmin(filters: {
  q?: string;
  tier?: string;
} = {}): Promise<AdminHostListRow[]> {
  const supabase = await createClient();

  // Hosts = anyone who has posted at least one trip
  const { data: tripData } = await supabase
    .from("trips")
    .select("host_id, status");

  const hostIds = [...new Set((tripData ?? []).map((t: any) => t.host_id as string))];
  if (hostIds.length === 0) return [];

  let q = supabase
    .from("profiles")
    .select("*")
    .in("id", hostIds)
    .order("created_at", { ascending: false });

  if (filters.q) {
    const p = `%${filters.q}%`;
    q = q.or(`name.ilike.${p},email.ilike.${p}`);
  }
  if (filters.tier && filters.tier !== "any") q = q.eq("host_tier", filters.tier);

  const { data: profiles, error } = await q;
  if (error) { console.error("listHostsForAdmin:", error); return []; }

  const tripMap = new Map<string, { live: number; total: number }>();
  for (const t of (tripData ?? []) as { host_id: string; status: string }[]) {
    const cur = tripMap.get(t.host_id) ?? { live: 0, total: 0 };
    cur.total++;
    if (t.status === "live") cur.live++;
    tripMap.set(t.host_id, cur);
  }

  // Batch-fetch host ratings from reviews (subject_type = 'user')
  const { data: reviewData } = await supabase
    .from("reviews")
    .select("subject_id, rating")
    .eq("subject_type", "user")
    .eq("is_visible", true)
    .in("subject_id", hostIds);

  const ratingMap = new Map<string, { sum: number; count: number }>();
  for (const r of (reviewData ?? []) as { subject_id: string; rating: number }[]) {
    const cur = ratingMap.get(r.subject_id) ?? { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count++;
    ratingMap.set(r.subject_id, cur);
  }

  return (profiles as Profile[]).map((p) => {
    const rat = ratingMap.get(p.id);
    return {
      profile: p,
      liveTrips: tripMap.get(p.id)?.live ?? 0,
      totalTrips: tripMap.get(p.id)?.total ?? 0,
      ratingAvg: rat ? Math.round((rat.sum / rat.count) * 10) / 10 : 0,
    };
  });
}

export async function adminSetHostTier(
  userId: string,
  tier: "standard" | "superhost" | "flagged",
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("profiles").update({ host_tier: tier }).eq("id", userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin — Reviews (T9.11)
// ─────────────────────────────────────────────────────────────────────────────

export type AdminReviewListRow = {
  review: Review;
  author: { id: string; name: string; avatar_url: string | null } | null;
  subjectTitle: string | null;
};

export async function listReviewsForAdmin(filters: {
  q?: string;
  visible?: "any" | "visible" | "hidden";
} = {}): Promise<AdminReviewListRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("reviews")
    .select("*, author:profiles!reviews_author_id_fkey(id,name,avatar_url)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.visible === "visible") q = q.eq("is_visible", true);
  if (filters.visible === "hidden") q = q.eq("is_visible", false);
  if (filters.q) {
    const p = `%${filters.q}%`;
    q = q.ilike("text", p);
  }

  const { data, error } = await q;
  if (error) { console.error("listReviewsForAdmin:", error); return []; }

  const rows = (data ?? []) as any[];

  // Resolve subject titles in batch
  const tripIds = rows.filter((r) => r.subject_type === "trip").map((r) => r.subject_id);
  const pkgIds = rows.filter((r) => r.subject_type === "package").map((r) => r.subject_id);
  const userIds = rows.filter((r) => r.subject_type === "user").map((r) => r.subject_id);

  const [tripsRes, pkgsRes, usersRes] = await Promise.all([
    tripIds.length ? supabase.from("trips").select("id,title").in("id", tripIds) : Promise.resolve({ data: [] }),
    pkgIds.length ? supabase.from("packages").select("id,title").in("id", pkgIds) : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from("profiles").select("id,name").in("id", userIds) : Promise.resolve({ data: [] }),
  ]);

  const titleMap = new Map<string, string>();
  for (const t of (tripsRes.data ?? []) as { id: string; title: string }[]) titleMap.set(t.id, t.title);
  for (const p of (pkgsRes.data ?? []) as { id: string; title: string }[]) titleMap.set(p.id, p.title);
  for (const u of (usersRes.data ?? []) as { id: string; name: string }[]) titleMap.set(u.id, u.name);

  return rows.map((row) => ({
    review: row as Review,
    author: row.author ?? null,
    subjectTitle: titleMap.get(row.subject_id) ?? null,
  }));
}

export async function adminSetReviewVisibility(
  reviewId: string,
  visible: boolean,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("reviews").update({ is_visible: visible }).eq("id", reviewId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin — Platform Settings (T9.12)
// ─────────────────────────────────────────────────────────────────────────────

export type PlatformSetting = {
  key: string;
  value: number;
  updated_at: string;
};

export async function getPlatformSettings(): Promise<PlatformSetting[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("key, value, updated_at")
    .order("key");
  if (error) { console.error("getPlatformSettings:", error); return []; }
  return (data ?? []).map((row: any) => ({
    key: row.key,
    value: Number(row.value),
    updated_at: row.updated_at,
  }));
}

export async function updatePlatformSetting(
  key: string,
  value: number,
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase
    .from("platform_settings")
    .update({
      value,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("key", key);
}

// ─────────────────────────────────────────────────────────────────────────────
// Traveller Passport (D1)
// ─────────────────────────────────────────────────────────────────────────────

export type PassportTrip = {
  bookingId: string;
  itemType: "trip" | "package";
  itemId: string;
  title: string;
  location: string;
  image: string | null;
  startDate: string;
};

export type TravellerPassportData = {
  profile: Profile;
  tripsJoined: PassportTrip[];
  reviewsReceived: (Review & {
    author: { id: string; name: string; avatar_url: string | null };
  })[];
};

export async function getTravellerPassport(
  userId: string,
): Promise<TravellerPassportData | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<Profile>();

  if (!profile) return null;

  // Bookings (trips + packages joined, most recent first)
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, item_type, item_id, status, created_at")
    .eq("user_id", userId)
    .in("status", ["confirmed", "requested"])
    .order("created_at", { ascending: false })
    .limit(12);

  const rows = (bookings ?? []) as {
    id: string;
    item_type: string;
    item_id: string;
    status: string;
    created_at: string;
  }[];

  const tripIds = rows.filter((b) => b.item_type === "trip").map((b) => b.item_id);
  const pkgIds  = rows.filter((b) => b.item_type === "package").map((b) => b.item_id);

  const [tripsRes, pkgsRes] = await Promise.all([
    tripIds.length
      ? supabase.from("trips").select("id, title, location, images, start_date").in("id", tripIds)
      : Promise.resolve({ data: [] }),
    pkgIds.length
      ? supabase.from("packages").select("id, title, location, images, start_date").in("id", pkgIds)
      : Promise.resolve({ data: [] }),
  ]);

  const itemMap = new Map<string, { title: string; location: string; images: string[]; start_date: string }>();
  for (const t of (tripsRes.data ?? []) as any[]) itemMap.set(t.id, t);
  for (const p of (pkgsRes.data ?? []) as any[]) itemMap.set(p.id, p);

  const tripsJoined: PassportTrip[] = rows
    .map((b) => {
      const item = itemMap.get(b.item_id);
      if (!item) return null;
      return {
        bookingId: b.id,
        itemType: b.item_type as "trip" | "package",
        itemId: b.item_id,
        title: item.title,
        location: item.location,
        image: item.images?.[0] ?? null,
        startDate: item.start_date,
      };
    })
    .filter(Boolean) as PassportTrip[];

  // Reviews received as a joiner (host → joiner reviews)
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("*, author:profiles!reviews_author_id_fkey(id, name, avatar_url)")
    .eq("subject_id", userId)
    .eq("subject_type", "user")
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    profile,
    tripsJoined,
    reviewsReceived: (reviewsData ?? []) as TravellerPassportData["reviewsReceived"],
  };
}
