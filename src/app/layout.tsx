import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Variable serif with optical-size axis - premium magazine feel for
// editorial display type. Body type stays on Inter.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://packuptrip.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Packuptrip — Find your trip, or find your people",
    template: "%s · Packuptrip",
  },
  description:
    "Book a hand-crafted tour with Packuptrip Originals, or join a fellow traveller's journey. Verified hosts, 2-way reviews, real community.",
  keywords: ["travel India", "group trips", "community travel", "backpacking India", "trip packages India"],
  authors: [{ name: "Packuptrip" }],
  creator: "Packuptrip",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "Packuptrip",
    title: "Packuptrip — Find your trip, or find your people",
    description:
      "Book a hand-crafted tour or join a fellow traveller's journey. Two ways to travel, one warm community.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Packuptrip — group travel across India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Packuptrip — Find your trip, or find your people",
    description:
      "Book a hand-crafted tour or join a fellow traveller's journey.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-ink">
        {children}
      </body>
    </html>
  );
}
