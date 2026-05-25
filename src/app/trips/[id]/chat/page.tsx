import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";
import { getTripMessages, getTripChatMembers, isTripChatMember } from "@/actions/tripChat";
import { TripChatClient } from "./TripChatClient";
import type { Trip } from "@/types/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select("title")
    .eq("id", id)
    .single<Pick<Trip, "title">>();
  return { title: data ? `${data.title} · Group chat` : "Trip chat · Packuptrip" };
}

export default async function TripChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/trips/${id}/chat`);

  // Auth check — must be host or joiner
  const member = await isTripChatMember(id);
  if (!member) redirect(`/trips/${id}`);

  const { data: trip } = await supabase
    .from("trips")
    .select("id, title, location, images, start_date, status")
    .eq("id", id)
    .single<Pick<Trip, "id" | "title" | "location" | "images" | "start_date" | "status">>();

  if (!trip) notFound();

  const [messages, members] = await Promise.all([
    getTripMessages(id),
    getTripChatMembers(id),
  ]);

  return (
    <div className="flex h-screen flex-col bg-stone-50">
      {/* Slim header — full Header is too heavy for a chat full-screen */}
      <div className="flex shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 shadow-sm">
        <Link
          href={`/trips/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 transition-colors"
          aria-label="Back to trip"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        {/* Trip thumbnail */}
        {trip.images[0] && (
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-stone-100">
            <img src={trip.images[0]} alt={trip.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{trip.title}</p>
          <p className="text-[11px] text-stone-400">
            {trip.location} ·{" "}
            {new Date(trip.start_date).toLocaleDateString("en-IN", {
              day: "numeric", month: "short",
            })}
          </p>
        </div>

        {/* Header logo */}
        <Link href="/" className="shrink-0 text-sm font-bold tracking-tight text-ink">
          Packuptrip
        </Link>
      </div>

      {/* Chat — takes remaining height */}
      <div className="flex-1 overflow-hidden">
        <TripChatClient
          tripId={id}
          tripTitle={trip.title}
          currentUserId={user.id}
          initialMessages={messages}
          members={members}
        />
      </div>
    </div>
  );
}
