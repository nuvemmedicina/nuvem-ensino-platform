"use client";

import { useState } from "react";
import { EnrollmentRow } from "./EnrollmentRow";

type Enrollment = Parameters<typeof EnrollmentRow>[0]["enrollment"];

export function EnrollmentTable({
  enrollments,
  dateLocale,
  courses,
}: {
  enrollments: Enrollment[];
  dateLocale: string;
  courses: { id: string; title: string }[];
}) {
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = enrollments.filter((e) => {
    if (courseFilter !== "all" && e.courseId !== courseFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="font-sans text-sm px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:border-primary/50 min-w-[220px]"
        >
          <option value="all">Todos os cursos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="font-sans text-sm px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:border-primary/50"
        >
          <option value="all">Todos os status</option>
          <option value="ACTIVE">Ativa</option>
          <option value="COMPLETED">Concluída</option>
          <option value="CANCELLED">Cancelada</option>
          <option value="REFUNDED">Reembolsada</option>
        </select>

        <span className="font-sans text-sm text-muted self-center">
          {filtered.length} matrícula{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabela */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Aluno</th>
              <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Curso</th>
              <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">Data</th>
              <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">Presenças</th>
              <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">Pagamento</th>
              <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center font-sans text-sm text-muted">
                  Nenhuma matrícula encontrada para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <EnrollmentRow key={e.id} enrollment={e} dateLocale={dateLocale} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
