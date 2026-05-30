import Image from "next/image";

type PhilosophyQuoteProps = {
  quote: string;
  backgroundImage?: string | null;
  hostName: string;
};

export function PhilosophyQuote({
  quote,
  backgroundImage,
  hostName,
}: PhilosophyQuoteProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl">
      {backgroundImage ? (
        <>
          <Image
            src={backgroundImage}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[#2d5130]" />
      )}

      <div className="relative px-8 py-16 text-center sm:px-12 sm:py-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/70">
          Travel philosophy
        </p>
        <blockquote
          className="mx-auto mt-6 max-w-3xl font-serif font-medium italic leading-[1.35] text-white"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
        >
          &ldquo;{quote}&rdquo;
        </blockquote>
        <p className="mt-6 text-[13px] font-semibold text-white/80">— {hostName}</p>
      </div>
    </section>
  );
}
