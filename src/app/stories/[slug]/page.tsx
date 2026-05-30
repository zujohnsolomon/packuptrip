import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { hostUrl } from "@/lib/supabase/queries";
import type { Story } from "@/types/db";

export const dynamic = "force-dynamic";

type AuthorMini = { id: string; name: string; username: string | null; avatar_url: string | null; home_city: string | null };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("stories")
    .select("title, subtitle, cover_image")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!data) return { title: "Story · Packuptrip" };
  return {
    title: `${data.title} · Stories · Packuptrip`,
    description: data.subtitle ?? undefined,
    openGraph: {
      images: data.cover_image ? [data.cover_image] : [],
    },
  };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: storyRaw } = await supabase
    .from("stories")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!storyRaw) notFound();
  const story = storyRaw as Story;

  // Author
  let author: AuthorMini | undefined;
  if (story.author_id) {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url, home_city")
      .eq("id", story.author_id)
      .single();
    author = (data ?? undefined) as AuthorMini | undefined;
  }

  // Related — same tags, newest first, exclude current
  let related: Story[] = [];
  if (story.tags.length > 0) {
    const { data } = await supabase
      .from("stories")
      .select("id, slug, title, subtitle, cover_image, published_at, reading_minutes, tags")
      .eq("status", "published")
      .neq("id", story.id)
      .overlaps("tags", story.tags)
      .order("published_at", { ascending: false })
      .limit(3);
    related = (data ?? []) as Story[];
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        {/* Cover photo */}
        {story.cover_image && (
          <div className="relative h-[55vh] min-h-[360px] w-full bg-stone-100">
            <Image
              src={story.cover_image}
              alt={story.title}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white" />
          </div>
        )}

        <article className="mx-auto max-w-2xl px-4 pb-20 sm:px-6 lg:px-8">
          {/* Tag */}
          {story.tags[0] && (
            <p className="mt-12 text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-500">
              {story.tags[0]}
            </p>
          )}

          {/* Title */}
          <h1
            className="mt-5 font-serif font-medium leading-[1.05] tracking-tight text-ink"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              fontVariationSettings: "'opsz' 144",
            }}
          >
            {story.title}
          </h1>

          {/* Subtitle / standfirst */}
          {story.subtitle && (
            <p className="mt-5 font-serif text-xl italic leading-relaxed text-stone-600 sm:text-2xl">
              {story.subtitle}
            </p>
          )}

          {/* Byline */}
          <div className="mt-8 flex flex-wrap items-center gap-3 border-y border-stone-100 py-5 text-sm">
            {author && (
              <Link
                href={hostUrl(author)}
                className="group flex items-center gap-3 text-stone-700 hover:text-ink"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-100">
                  {author.avatar_url ? (
                    <Image
                      src={author.avatar_url}
                      alt={author.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-xs font-semibold text-stone-500">
                      {author.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="leading-tight">
                  <div className="font-semibold group-hover:underline group-hover:underline-offset-2">
                    {author.name}
                  </div>
                  {author.home_city && (
                    <div className="text-xs text-stone-500">{author.home_city}</div>
                  )}
                </div>
              </Link>
            )}
            <span className="ml-auto flex items-center gap-3 text-xs text-stone-500">
              {story.published_at && (
                <time dateTime={story.published_at}>
                  {new Date(story.published_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              )}
              <span className="text-stone-300">·</span>
              <span>{story.reading_minutes} min read</span>
            </span>
          </div>

          {/* Body — basic prose styling. Future: render markdown properly. */}
          <div
            className="prose-story mt-10 font-serif text-[18px] leading-[1.75] text-stone-800 [&>blockquote]:my-8 [&>blockquote]:border-l-2 [&>blockquote]:border-stone-300 [&>blockquote]:pl-6 [&>blockquote]:italic [&>h2]:mt-12 [&>h2]:font-serif [&>h2]:text-[1.75rem] [&>h2]:font-medium [&>h2]:text-ink [&>h3]:mt-10 [&>h3]:font-serif [&>h3]:text-[1.35rem] [&>h3]:font-medium [&>h3]:text-ink [&>p]:mt-6"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: renderBody(story.body) }}
          />

          {/* End mark */}
          <div className="mt-16 text-center text-stone-300">— Fin —</div>

          {/* Tags */}
          {story.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Filed under
              </span>
              {story.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-700"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-stone-100 bg-stone-50">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                Keep reading
              </p>
              <h2
                className="mt-3 font-serif font-medium leading-tight text-ink"
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontVariationSettings: "'opsz' 144",
                }}
              >
                More from The Journal
              </h2>
              <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.id} href={`/stories/${r.slug}`} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100">
                      {r.cover_image && (
                        <Image
                          src={r.cover_image}
                          alt={r.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 350px"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <h3
                      className="mt-3 font-serif font-medium leading-tight text-ink"
                      style={{ fontSize: "1.25rem", fontVariationSettings: "'opsz' 144" }}
                    >
                      {r.title}
                    </h3>
                    {r.subtitle && (
                      <p className="mt-1 line-clamp-2 text-sm text-stone-600">
                        {r.subtitle}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

/* Minimal body renderer: turns blank lines into paragraphs and supports
 * a few light Markdown-ish features (## headings, > quotes). Replace with
 * a real markdown engine (e.g. react-markdown) once authoring grows. */
function renderBody(body: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const blocks = body.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const t = block.trim();
      if (!t) return "";
      if (t.startsWith("## ")) return `<h2>${escape(t.slice(3))}</h2>`;
      if (t.startsWith("# ")) return `<h2>${escape(t.slice(2))}</h2>`;
      if (t.startsWith("### ")) return `<h3>${escape(t.slice(4))}</h3>`;
      if (t.startsWith("> ")) return `<blockquote>${escape(t.slice(2))}</blockquote>`;
      return `<p>${escape(t).replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
}
