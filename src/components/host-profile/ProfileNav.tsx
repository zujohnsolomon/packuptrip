"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "trips", label: "Trips" },
  { id: "reviews", label: "Reviews" },
  { id: "stories", label: "Stories" },
  { id: "gallery", label: "Gallery" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** Fixed header + sticky tab bar clearance */
const SCROLL_OFFSET = 96;

const MAIN_SECTION_IDS: SectionId[] = ["about", "trips", "reviews"];

export function ProfileNav() {
  const [active, setActive] = useState<SectionId>("about");
  const scrollLock = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToSection = useCallback((id: SectionId) => {
    const el = document.getElementById(id);
    if (!el) return;

    scrollLock.current = true;
    if (lockTimer.current) clearTimeout(lockTimer.current);

    setActive(id);

    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "instant" });

    history.replaceState(null, "", `#${id}`);

    lockTimer.current = setTimeout(() => {
      scrollLock.current = false;
    }, 700);
  }, []);

  // Highlight tab from scroll position (main column sections only)
  useEffect(() => {
    const elements = MAIN_SECTION_IDS.map((id) => document.getElementById(id)).filter(
      Boolean
    ) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollLock.current) return;

        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActive(visible[0].target.id as SectionId);
        }
      },
      {
        rootMargin: `-${SCROLL_OFFSET + 8}px 0px -45% 0px`,
        threshold: [0, 0.15, 0.35, 0.55, 0.75],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Deep link: /hosts/foo#trips
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as SectionId;
    if (SECTIONS.some((s) => s.id === hash)) {
      requestAnimationFrame(() => scrollToSection(hash));
    }
  }, [scrollToSection]);

  return (
    <nav
      aria-label="Profile sections"
      className="sticky top-16 z-20 -mx-1 border-b border-stone-200/80 bg-[#f8f5ef]/90 px-1 backdrop-blur-md supports-[backdrop-filter]:bg-[#f8f5ef]/80"
    >
      <div className="flex items-center gap-7 overflow-x-auto text-[13px] font-semibold [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              aria-current={isActive ? "true" : undefined}
              className={`relative shrink-0 py-3 transition-colors duration-200 ${
                isActive
                  ? "text-[#17120f]"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {label}
              <span
                className={`absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[#17120f] transition-all duration-300 ease-out ${
                  isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
