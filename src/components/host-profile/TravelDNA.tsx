import {
  AdventureIcon,
  CameraIcon,
  CultureIcon,
  FoodIcon,
  LeafIcon,
  SectionLabel,
  SparkleIcon,
} from "./icons";

const DEFAULT_TAGS = ["Adventure", "Culture", "Food", "Photography", "Nature"];

function tagIcon(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("adventure") || normalized.includes("mountain")) return <AdventureIcon />;
  if (normalized.includes("culture")) return <CultureIcon />;
  if (normalized.includes("food")) return <FoodIcon />;
  if (normalized.includes("photo")) return <CameraIcon />;
  if (normalized.includes("nature") || normalized.includes("beach")) return <LeafIcon />;
  return <SparkleIcon />;
}

type TravelDNAProps = {
  tags: string[];
};

export function TravelDNA({ tags }: TravelDNAProps) {
  const displayTags = tags.length > 0 ? tags : DEFAULT_TAGS;

  return (
    <section className="rounded-2xl border border-stone-200 bg-[#faf8f4] p-6 sm:p-7">
      <SectionLabel>Travel DNA</SectionLabel>
      <p className="mt-2 font-serif text-xl text-[#17120f]">
        How {displayTags.length > 0 ? "this host" : "they"} travel
      </p>
      <div className="mt-6 flex flex-wrap justify-start gap-6 sm:gap-8">
        {displayTags.slice(0, 8).map((tag) => (
          <div key={tag} className="flex w-[62px] flex-col items-center text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#1f1b17] shadow-sm">
              {tagIcon(tag)}
            </span>
            <span className="mt-2 text-[11px] font-semibold text-stone-600">{tag}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
