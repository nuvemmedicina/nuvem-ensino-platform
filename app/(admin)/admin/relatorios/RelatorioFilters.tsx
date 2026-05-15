"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";

type Course = { id: string; title: string };

export function RelatorioFilters({ courses }: { courses: Course[] }) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const from     = searchParams.get("from")     ?? "";
  const to       = searchParams.get("to")       ?? "";
  const courseId = searchParams.get("courseId") ?? "";

  function applyFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    startTransition(() => router.replace(`${pathname}?${p.toString()}`));
  }

  // URL para download do CSV com os mesmos filtros
  const csvParams = new URLSearchParams();
  if (from)     csvParams.set("from",     from);
  if (to)       csvParams.set("to",       to);
  if (courseId) csvParams.set("courseId", courseId);
  const csvUrl = `/api/admin/relatorios/csv?${csvParams.toString()}`;

  const inputClass =
    "px-3 py-2 rounded-xl bg-surface border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* De */}
      <div className="flex flex-col gap-1">
        <label className="font-sans text-[10px] text-muted uppercase tracking-wider">De</label>
        <input
          type="date"
          defaultValue={from}
          onChange={(e) => applyFilter("from", e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Até */}
      <div className="flex flex-col gap-1">
        <label className="font-sans text-[10px] text-muted uppercase tracking-wider">Até</label>
        <input
          type="date"
          defaultValue={to}
          onChange={(e) => applyFilter("to", e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Curso */}
      <div className="flex flex-col gap-1">
        <label className="font-sans text-[10px] text-muted uppercase tracking-wider">Curso</label>
        <select
          defaultValue={courseId}
          onChange={(e) => applyFilter("courseId", e.target.value)}
          className={`${inputClass} cursor-pointer max-w-56`}
        >
          <option value="">Todos os cursos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Spinner de loading */}
      {isPending && <Loader2 className="w-4 h-4 text-muted animate-spin self-end mb-2" />}

      {/* Botão CSV */}
      <a
        href={csvUrl}
        download
        className="flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors self-end"
      >
        <Download className="w-4 h-4" />
        Exportar CSV
      </a>
    </div>
  );
}
