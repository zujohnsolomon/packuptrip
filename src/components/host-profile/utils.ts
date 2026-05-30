import type { Profile } from "@/types/db";
import type { PublicContact } from "./types";

export function hasSocialLinks(c: PublicContact | null): boolean {
  if (!c) return false;
  return !!(
    c.instagram ||
    c.facebook ||
    c.youtube ||
    c.linkedin ||
    c.twitter ||
    c.whatsapp
  );
}

export function friendlyDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function trimText(t: string, max: number) {
  return t.length > max ? `${t.slice(0, max).trim()}…` : t;
}

export function deriveEditorialCopy(profile: Profile, firstName: string) {
  const defaultHeadline = "Exploring the world. Sharing what matters.";
  const defaultSubheadline = `${firstName} hosts community trips for travellers who want real places, real people, and stories worth keeping.`;

  if (!profile.bio?.trim()) {
    return { headline: defaultHeadline, subheadline: defaultSubheadline };
  }

  const sentences = profile.bio.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length >= 2) {
    return {
      headline: sentences[0],
      subheadline: sentences.slice(1).join(" "),
    };
  }

  return { headline: defaultHeadline, subheadline: profile.bio };
}

export function yearsHosting(createdAt: string): number {
  const start = new Date(createdAt).getFullYear();
  const now = new Date().getFullYear();
  return Math.max(1, now - start + 1);
}

export type FAQItem = { question: string; answer: string };

export function buildHostFAQ(firstName: string): FAQItem[] {
  return [
    {
      question: "What type of travelers join your trips?",
      answer: `${firstName} welcomes curious, easy-going travellers who enjoy shared experiences — solo travellers, couples, and small groups who want real connection on the road.`,
    },
    {
      question: "Is this suitable for solo travelers?",
      answer: "Yes. Community trips are designed for people travelling alone who want to join a small group with a trusted host.",
    },
    {
      question: "What is included?",
      answer: "Each trip listing shows inclusions and the cost split clearly on the trip detail page before you book.",
    },
    {
      question: "How safe are the trips?",
      answer: "Hosts are verified on Packuptrip, reviews come from real joiners, and you can message the host before committing.",
    },
    {
      question: "What is the cancellation policy?",
      answer: "Cancellation terms depend on the trip and timing — check the trip page and booking confirmation for the exact policy.",
    },
  ];
}
