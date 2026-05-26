"use client";

import { useState } from "react";

export function InviteCopyBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
      <span className="flex-1 truncate font-mono text-xs text-stone-600 select-all">
        {url}
      </span>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-cream transition hover:bg-stone-700 active:scale-95"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
