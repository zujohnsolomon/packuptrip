import type { Profile, Review, Trip } from "@/types/db";

export type JoinerAvatar = { id: string; name: string; avatar_url: string | null };

export type PublicContact = {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  facebook: string | null;
  youtube: string | null;
  linkedin: string | null;
  twitter: string | null;
};

export type ReviewWithAuthor = Review & {
  author: { id: string; name: string; avatar_url: string | null };
};

export type HostProfileProps = {
  profile: Profile;
  hostId: string;
  isOwnProfile: boolean;
  publicContact: PublicContact | null;
  trips: Trip[];
  upcomingTrips: Trip[];
  featuredTrips: Trip[];
  pastTrips: Trip[];
  reviews: ReviewWithAuthor[];
  avgRating: number | null;
  happyTravelersCount: number;
  joinersByTrip: Map<string, JoinerAvatar[]>;
  galleryImages: string[];
  coverPhoto: string;
};
