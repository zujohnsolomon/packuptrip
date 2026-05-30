"use client";

import { useState } from "react";
import type { FAQItem } from "./utils";

type FAQAccordionProps = {
  items: FAQItem[];
};

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-7">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
        Questions
      </p>
      <h3 className="mt-2 font-serif text-2xl text-[#17120f]">Before you book</h3>

      <div className="mt-6 divide-y divide-stone-100">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-[14px] font-semibold text-[#17120f]">{item.question}</span>
                <span className="shrink-0 text-xl leading-none text-stone-400">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <p className="pb-4 text-[14px] leading-7 text-stone-600">{item.answer}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
