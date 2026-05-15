import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Video, MapPin, Calendar, CalendarX } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtDate = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function makeCalendarUrl(s: {
  title: string;
  startAt: Date;
  endAt: Date;
  meetUrl: string | null;
  location: string | null;
  course: { title: string };
}): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action:   "TEMPLATE",
    text:     s.title,
    dates:    `${fmt(s.startAt)}/${fmt(s.endAt)}`,
    details:  s.meetUrl ? `Link: ${s.meetUrl}` : s.course.title,
    location: s.location ?? s.meetUrl ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── SessionCard ─────────────────────────────────────────────────────────────

type SessionData = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  meetUrl: string | null;
  location: string | null;
  course: { title: string; slug: string };
};

function SessionCard({
  session: s,
  past = false,
}: {
  session: SessionData;
  past?: boolean;
}) {
  const calUrl = makeCalendarUrl(s);

  return (
    <div
      className={`bg-surface border rounded-2xl px-5 py-5 transition-colors ${
        past
          ? "border-border opacity-60"
          : "border-border hover:border-primary/30"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Badge do curso */}
          <span className="inline-block font-sans text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-2">
            {s.course.title}
          </span>

          <p className="font-sans text-sm font-semibold text-foreground leading-snug mb-1">
            {s.title}
          </p>

          {s.description && (
            <p className="font-sans text-xs text-muted mb-2 line-clamp-2">
              {s.description}
            </p>
          )}

          <p className="font-sans text-xs text-muted flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {fmtDate.format(new Date(s.startAt))}
          </p>

          {s.meetUrl && (
            <p className="font-sans text-xs text-muted flex items-center gap-1.5 mt-1">
              <Video className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{s.meetUrl.replace(/^https?:\/\//, "")}</span>
            </p>
          )}

          {s.location && (
            <p className="font-sans text-xs text-muted flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {s.location}
            </p>
          )}
        </div>

        {/* Ações — só para lives futuras */}
        {!past && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-col sm:items-end">
            {s.meetUrl && (
              <a
                href={s.meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-xs font-semibold px-4 py-2 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors whitespace-nowrap"
              >
                Entrar no Meet
              </a>
            )}
            <a
              href={calUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs font-semibold px-4 py-2 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
            >
              + Google Agenda
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
      {children}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function AulasAoVivoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/aulas-ao-vivo");

  // Busca matrículas do aluno
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    select: { courseId: true },
  });

  const courseIds = enrollments.map((e) => e.courseId);

  // Busca lives de todos os cursos matriculados
  const liveSessions = courseIds.length
    ? await prisma.liveSession.findMany({
        where: { courseId: { in: courseIds } },
        include: { course: { select: { title: true, slug: true } } },
        orderBy: { startAt: "asc" },
      })
    : [];

  const now = new Date();
  const upcoming = liveSessions.filter((s) => new Date(s.startAt) >= now);
  const past = liveSessions
    .filter((s) => new Date(s.startAt) < now)
    .reverse();

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">
          Aulas ao Vivo
        </h1>
        <p className="font-sans text-sm text-muted mt-1">
          {upcoming.length === 0
            ? "Nenhuma aula ao vivo agendada"
            : upcoming.length === 1
            ? "1 aula próxima"
            : `${upcoming.length} aulas próximas`}
        </p>
      </div>

      {/* Empty state: sem matrículas */}
      {courseIds.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <CalendarX className="w-10 h-10 text-muted/40" />
          <p className="font-sans text-sm text-muted">
            Você não está matriculado em nenhum curso.
          </p>
          <Link
            href="/cursos"
            className="font-sans text-xs font-semibold px-4 py-2 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors mt-1"
          >
            Ver cursos disponíveis
          </Link>
        </div>
      )}

      {/* Empty state: matriculado mas sem lives */}
      {courseIds.length > 0 && liveSessions.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <CalendarX className="w-10 h-10 text-muted/40" />
          <p className="font-sans text-sm text-muted">
            Nenhuma aula ao vivo agendada para seus cursos ainda.
          </p>
        </div>
      )}

      {/* Próximas */}
      {upcoming.length > 0 && (
        <section className="mb-10">
          <SectionLabel>Próximas</SectionLabel>
          <div className="flex flex-col gap-3">
            {upcoming.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        </section>
      )}

      {/* Anteriores */}
      {past.length > 0 && (
        <section>
          <SectionLabel>Anteriores</SectionLabel>
          <div className="flex flex-col gap-3">
            {past.map((s) => (
              <SessionCard key={s.id} session={s} past />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
