"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function TopicAccordion({
  title,
  index,
  lessonCount,
  defaultOpen = false,
  header,
  children,
}: {
  title: string;
  index: number;
  lessonCount: number;
  defaultOpen?: boolean;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors duration-200 ${
        open ? "border-primary/30" : "border-border/60"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
          open ? "bg-primary/5" : "bg-background/60 hover:bg-muted/5"
        }`}
      >
        <span
          className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-sans text-[10px] font-bold transition-colors ${
            open ? "bg-primary text-white" : "bg-muted/20 text-muted"
          }`}
        >
          {index + 1}
        </span>

        <span className="flex-1 font-sans text-sm font-medium text-foreground truncate">
          {title}
        </span>

        <span className="font-sans text-[10px] text-muted shrink-0">
          {lessonCount} aula{lessonCount !== 1 ? "s" : ""}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 300ms ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div className="border-t border-border/60 bg-background/30">
            {header}
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
