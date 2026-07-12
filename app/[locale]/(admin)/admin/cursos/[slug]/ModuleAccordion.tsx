"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export function ModuleAccordion({
  title,
  index,
  lessonCount,
  countLabel = "tema",
  locked,
  defaultOpen = false,
  header,
  children,
}: {
  title: string;
  index: number;
  lessonCount: number;
  countLabel?: string;
  locked: boolean;
  defaultOpen?: boolean;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-colors duration-200 ${
        open ? "border-primary/40 shadow-sm shadow-primary/10" : "border-border"
      }`}
    >
      {/* Trigger — clique abre/fecha */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
          open ? "bg-primary/5" : "bg-background hover:bg-muted/5"
        }`}
      >
        {/* Número */}
        <span
          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-sans text-[11px] font-bold transition-colors ${
            open ? "bg-primary text-white" : "bg-muted/20 text-muted"
          }`}
        >
          {index + 1}
        </span>

        {/* Título */}
        <span className="flex-1 font-sans text-sm font-semibold text-foreground truncate">
          {title}
        </span>

        {/* Badges */}
        <span className="font-sans text-[10px] text-muted shrink-0">
          {lessonCount} {countLabel}{lessonCount !== 1 ? "s" : ""}
        </span>
        {locked && (
          <span className="font-sans text-[10px] text-amber-600 shrink-0">🔒</span>
        )}

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-muted shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Conteúdo com animação de deslize */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 300ms ease",
        }}
      >
        <div ref={bodyRef} style={{ overflow: "hidden" }}>
          {/* Campos de edição do módulo (título, data, docentes) */}
          <div className="border-t border-border bg-background/50">
            {header}
          </div>
          {/* Aulas e prova */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
