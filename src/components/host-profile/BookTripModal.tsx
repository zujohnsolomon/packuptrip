"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Trip } from "@/types/db";
import { ChevronRightIcon } from "./icons";

export function BookTripModal({
  trips,
  hostName,
  isOpen,
  onClose,
}: {
  trips: Trip[];
  hostName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const upcomingTrips = trips.filter((t) => t.status === "live").slice(0, 6);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 max-h-[80vh] w-auto max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-ink">
          {hostName}'s trips
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          {upcomingTrips.length === 0
            ? "No trips available right now"
            : `${upcomingTrips.length} trip${upcomingTrips.length !== 1 ? "s" : ""} available`}
        </p>

        {upcomingTrips.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {upcomingTrips.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/book/trip/${trip.id}`}
                  className="group block rounded-lg border border-stone-200 p-3 hover:bg-stone-50"
                  onClick={onClose}
                >
                  <div className="flex gap-3">
                    {trip.images[0] && (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={trip.images[0]}
                          alt={trip.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-ink line-clamp-2">
                        {trip.title}
                      </h3>
                      <p className="mt-1 text-xs text-stone-500">
                        {trip.location}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-green-700">
                        ₹{Number(trip.price_per_share).toLocaleString("en-IN")} per share
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center text-stone-400 group-hover:text-stone-600">
                      <ChevronRightIcon />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-lg bg-stone-50 p-4 text-center">
            <p className="text-sm text-stone-600">
              Check back soon for new trips!
            </p>
          </div>
        )}

        {upcomingTrips.length > 0 && (
          <Link
            href={`/trips?host=${hostName}`}
            className="mt-4 block text-center text-sm font-medium text-green-700 hover:text-green-800"
          >
            View all trips →
          </Link>
        )}
      </div>
    </>
  );
}
