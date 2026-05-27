import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import type { Story } from "@/types/db";

export const metadata = {
  title: "Stories · Packuptrip",
  description:
    "Trip diaries, host spotlights, and notes from the road. The Packuptrip journal.",
};

export const dynamic = "force-dynamic";

type AuthorMini = { id: string; name: string; avatar_url: string | null };

export default async function StoriesPage() {
  const supabase = await createClient();

  // Fetch published stories, newest first. Featured float to the very top.
  const { data: storiesRaw } = await supabase
    .from("stories")
    .select(
      "id, slug, title, subtitle, excerpt, cover_image, author_id, tags, featured, published_at, reading_minutes",
    )
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false });

  const stories = (storiesRaw ?? []) as Story[];

  // Authors for byline
  const authorIds = [...new Set(stories.map((s) => s.author_id).filter(Boolean))] as string[];
  const authorMap = new Map<string, AuthorMini>();
  if (authorIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", authorIds);
    for (const a of (data ?? []) as AuthorMini[]) authorMap.set(a.id, a);
  }

  const [hero, ...rest] = stories;

  return (
    <>
      <Header />
      <main className="flex-1 bg-stone-50 pt-20">
        {/* Hero / masthead */}
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16 lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
              · The Journal ·
            </p>
            <h1
              className="mt-4 font-serif font-medium leading-[1.05] tracking-tight text-ink"
              style={{
                fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                fontVariationSettings: "'opsz' 144",
              }}
            >
              Stories from the road
            </h1>
            <p className="mt-4 max-w-2xl text-base text-stone-600 sm:text-lg">
              Trip diaries, host spotlights, and field notes from
              Packuptrip travellers. Long-form, slow-read, written by humans.
            </p>
          </div>
        </section>

        {stories.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Featured hero story */}
            {hero && (
              <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
                <FeaturedStory story={hero} author={hero.author_id ? authorMap.get(hero.author_id) : undefined} />
              </section>
            )}

            {/* Rest of the stories */}
            {rest.length > 0 && (
              <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
                <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((s) => (
                    <StoryCard
                      key={s.id}
                      story={s}
                      author={s.author_id ? authorMap.get(s.author_id) : undefined}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

/* ─── Featured (hero) story ───────────────────────────────────────────────── */

function FeaturedStory({ story, author }: { story: Story; author?: AuthorMini }) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group grid overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 sm:aspect-auto sm:min-h-[420px]">
        {story.cover_image ? (
          <Image
            src={story.cover_image}
            alt={story.title}
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            priority
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-stone-300">
            <span className="font-serif text-7xl italic">PT</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 p-7 sm:p-10 lg:p-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-500">
          Featured
        </p>
        <h2
          className="font-serif font-medium leading-[1.05] tracking-tight text-ink"
          style={{
            fontSize: "clamp(1.75rem, 3.2vw, 2.75rem)",
            fontVariationSettings: "'opsz' 144",
          }}
        >
          {story.title}
        </h2>
        {story.subtitle && (
          <p className="font-serif text-lg italic leading-relaxed text-stone-600">
            {story.subtitle}
          </p>
        )}
        <Byline author={author} publishedAt={story.published_at} readingMinutes={story.reading_minutes} />
      </div>
    </Link>
  );
}

/* ─── Standard story card ─────────────────────────────────────────────────── */

function StoryCard({ story, author }: { story: Story; author?: AuthorMini }) {
  return (
    <Link href={`/stories/${story.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100">
        {story.cover_image ? (
          <Image
            src={story.cover_image}
            alt={story.title}
            fill
            sizes="(max-width: 640px) 50vw, 350px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-stone-300">
            <span className="font-serif text-5xl italic">PT</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        {story.tags[0] && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            {story.tags[0]}
          </p>
        )}
        <h3
          className="mt-2 font-serif font-medium leading-tight text-ink transition-colors group-hover:text-stone-700"
          style={{
            fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
            fontVariationSettings: "'opsz' 144",
          }}
        >
          {story.title}
        </h3>
        {story.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">
            {story.excerpt}
          </p>
        )}
        <div className="mt-4">
          <Byline author={author} publishedAt={story.published_at} readingMinutes={story.reading_minutes} compact />
        </div>
      </div>
    </Link>
  );
}

/* ─── Byline (author + date + reading time) ───────────────────────────────── */

function Byline({
  author,
  publishedAt,
  readingMinutes,
  compact = false,
}: {
  author?: AuthorMini;
  publishedAt: string | null;
  readingMinutes: number;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-xs text-stone-500">
      {author && (
        <>
          <div className={`relative shrink-0 overflow-hidden rounded-full bg-stone-100 ${compact ? "h-6 w-6" : "h-8 w-8"}`}>
            {author.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={author.name}
                fill
                sizes={compact ? "24px" : "32px"}
                className="object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-[10px] font-semibold text-stone-500">
                {author.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="font-medium text-stone-700">{author.name}</span>
          <span className="text-stone-300">·</span>
        </>
      )}
      {publishedAt && (
        <>
          <time dateTime={publishedAt}>
            {new Date(publishedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
          <span className="text-stone-300">·</span>
        </>
      )}
      <span>{readingMinutes} min read</span>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center sm:py-24">
      <p className="font-serif text-3xl italic text-stone-400">
        Just getting the printing press warm.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-stone-500">
        Our first stories are being written by travellers as we speak.
        Check back soon — or share yours from a trip you&rsquo;ve already
        taken.
      </p>
      <Link
        href="/trips"
        className="mt-7 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
      >
        Browse trips meanwhile →
      </Link>
    </section>
  );
}
