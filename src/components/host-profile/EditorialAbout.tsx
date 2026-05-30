import Image from "next/image";
import { SectionLabel } from "./icons";
import { TravelStyleIcon } from "./TravelStyleIcon";

const DEFAULT_TAGS = ["Adventure", "Culture", "Food", "Photography", "Nature"];

function splitBio(bio: string): { heading: string; paragraphs: string[] } {
  const sentences = bio.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length === 0) return { heading: bio, paragraphs: [] };
  if (sentences.length === 1) return { heading: sentences[0], paragraphs: [] };
  const rest = sentences.slice(1);
  const mid = Math.ceil(rest.length / 2);
  return {
    heading: sentences[0],
    paragraphs: [rest.slice(0, mid).join(" "), rest.slice(mid).join(" ")].filter(Boolean),
  };
}

type EditorialAboutProps = {
  bio: string | null;
  firstName: string;
  portraitImage: string | null;
  travelStyleTags: string[];
};

export function EditorialAbout({
  bio,
  firstName,
  portraitImage,
  travelStyleTags,
}: EditorialAboutProps) {
  const tags = travelStyleTags.length > 0 ? travelStyleTags : DEFAULT_TAGS;
  const displayTags = tags.slice(0, 5);

  const { heading, paragraphs } = bio
    ? splitBio(bio)
    : {
        heading: "Travelling is my way of understanding life.",
        paragraphs: [
          `${firstName} believes travel is less about ticking destinations and more about the people you meet along the way.`,
          "Every trip is a chance to slow down, share a meal, and leave with stories that stay long after the bags are unpacked.",
        ],
      };

  const fallbackParagraphs =
    paragraphs.length > 0
      ? paragraphs
      : [
          `${firstName} hosts trips for travellers who want real places, real people, and stories worth keeping.`,
        ];

  return (
    <article id="about" className="w-full scroll-mt-28">
      <SectionLabel>About me</SectionLabel>

      {/* Text + portrait — fills the main column edge-to-edge */}
      <div className="mt-5 flex w-full flex-col gap-8 md:flex-row md:items-start md:gap-6 lg:gap-8">
        <div className="min-w-0 flex-1">
          <h2
            className="font-serif font-semibold leading-[1.12] tracking-tight text-[#17120f]"
            style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)" }}
          >
            {heading}
          </h2>

          {fallbackParagraphs.map((p, i) => (
            <p key={i} className="mt-4 text-[14px] leading-[1.75] text-stone-600">
              {p}
            </p>
          ))}

          {/* Travel DNA — even row, no orphan gaps */}
          <ul
            className="mt-8 grid w-full max-w-lg grid-cols-3 gap-x-4 gap-y-6 sm:max-w-none sm:grid-cols-5 sm:gap-x-2"
            aria-label="Travel style"
          >
            {displayTags.map((tag) => (
              <li key={tag} className="flex flex-col items-center text-center">
                <span className="mb-2 flex h-10 w-10 items-center justify-center">
                  <TravelStyleIcon tag={tag} />
                </span>
                <span className="text-[11px] font-semibold leading-tight text-stone-600">
                  {tag}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {portraitImage && (
          <div className="relative mx-auto w-full max-w-[240px] shrink-0 md:mx-0 md:w-[38%] md:max-w-[280px]">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-stone-100 shadow-[0_12px_30px_rgba(64,44,26,0.12)]">
              <Image
                src={portraitImage}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 768px) 240px, 280px"
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
