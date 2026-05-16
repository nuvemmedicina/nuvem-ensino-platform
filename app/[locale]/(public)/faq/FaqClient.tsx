"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-surface hover:bg-background transition-colors"
        aria-expanded={open}
      >
        <span className="font-sans text-sm font-semibold text-foreground pr-4">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 py-4 bg-background border-t border-border">
          <p className="font-sans text-sm text-muted leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqClient({ locale: _locale }: { locale: string }) {
  const t = useTranslations("faq");

  // next-intl supports raw() for arrays; we use index-based access
  const items = t.raw("items") as { q: string; a: string }[];

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <FaqItem key={i} q={item.q} a={item.a} />
      ))}
    </div>
  );
}
