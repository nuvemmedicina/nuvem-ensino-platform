import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MapPin, Calendar, CalendarX, PlayCircle, Radio } from "lucide-react";
import { getTranslations } from "next-intl/server";

// ── Helpers ────────────────────────────────────────────────────────────────

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
  recordingUrl: string | null;
  thumbnailUrl: string | null;
  course: { title: string; slug: string };
};

// Paleta de gradientes por índice para o thumbnail lateral
const GRADIENTS = [
  "from-[#0e4f6b] to-[#1a8fa8]",
  "from-[#1a3a5c] to-[#2d6a9f]",
  "from-[#3a1a5c] to-[#6a2d9f]",
  "from-[#1a4a2d] to-[#2d8f5c]",
  "from-[#4a2d1a] to-[#9f6a2d]",
];

function SessionCard({
  session: s,
  past = false,
  index = 0,
  joinMeetLabel,
  addToCalendarLabel,
  watchRecordingLabel,
  dateLocale,
}: {
  session: SessionData;
  past?: boolean;
  index?: number;
  joinMeetLabel: string;
  addToCalendarLabel: string;
  watchRecordingLabel: string;
  dateLocale: string;
}) {
  const calUrl = makeCalendarUrl(s);
  const fmtDate = new Intl.DateTimeFormat(dateLocale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
  const fmtTime = new Intl.DateTimeFormat(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  const initials = s.course.title
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || s.course.title.slice(0, 2).toUpperCase();

  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl flex transition-all duration-300 ${
        past
          ? "opacity-50 grayscale"
          : "hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/10"
      }`}
      style={{ background: "var(--color-surface)" }}
    >
      {/* Thumbnail lateral */}
      <div
        className={`relative hidden sm:flex w-36 shrink-0 overflow-hidden ${
          s.thumbnailUrl ? "" : `bg-gradient-to-br ${gradient}`
        } flex-col items-center justify-center gap-1 select-none`}
      >
        {s.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.thumbnailUrl}
            alt={s.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            <span className="font-serif text-2xl font-bold text-white/90 leading-none">
              {initials}
            </span>
            {!past && (
              <span className="flex items-center gap-1 font-sans text-[9px] font-bold uppercase tracking-widest text-white/60 mt-1">
                <Radio className="w-2.5 h-2.5" />
                ao vivo
              </span>
            )}
            {past && s.recordingUrl && (
              <PlayCircle className="w-5 h-5 text-white/40 mt-1" />
            )}
          </>
        )}
        {/* Badge AO VIVO sobre a imagem */}
        {s.thumbnailUrl && !past && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 font-sans text-[9px] font-bold uppercase tracking-widest bg-black/60 text-white px-1.5 py-0.5 rounded">
            <Radio className="w-2 h-2" />
            ao vivo
          </span>
        )}
        {/* Reflexo diagonal */}
        <div className="absolute inset-0 bg-gradient-to-tl from-white/5 to-transparent pointer-events-none" />
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4 px-5 py-5 min-w-0">
        <div className="flex-1 min-w-0">
          {/* Badge curso */}
          <span className="inline-block font-sans text-[9px] font-bold uppercase tracking-widest text-primary mb-2">
            {s.course.title}
          </span>

          <p className="font-sans text-base font-bold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">
            {s.title}
          </p>

          {s.description && (
            <p className="font-sans text-xs text-muted mb-2 line-clamp-2 leading-relaxed">
              {s.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="flex items-center gap-1.5 font-sans text-xs text-muted">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-primary/60" />
              <span className="capitalize">{fmtDate.format(new Date(s.startAt))}</span>
              <span className="text-muted/40">·</span>
              <span>{fmtTime.format(new Date(s.startAt))} – {fmtTime.format(new Date(s.endAt))}</span>
            </span>
            {s.location && (
              <span className="flex items-center gap-1 font-sans text-xs text-muted">
                <MapPin className="w-3 h-3 shrink-0" />
                {s.location}
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:shrink-0">
          {!past && s.meetUrl && (
            <a
              href={s.meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs font-bold px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors whitespace-nowrap shadow-md shadow-primary/20"
            >
              {joinMeetLabel}
            </a>
          )}
          {!past && (
            <a
              href={calUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-[11px] font-semibold px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-primary/40 transition-colors whitespace-nowrap"
            >
              {addToCalendarLabel}
            </a>
          )}
          {past && s.recordingUrl && (
            <a
              href={s.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-sans text-xs font-bold px-5 py-2.5 rounded-lg bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors whitespace-nowrap"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              {watchRecordingLabel}
            </a>
          )}
        </div>
      </div>

      {/* Borda luminosa esquerda nas próximas */}
      {!past && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-xs font-bold uppercase tracking-widest text-foreground/70 mb-4">
      {children}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function AulasAoVivoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.liveLessons" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/aulas-ao-vivo");

  const dateLocale = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";

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

  const upcomingSubtitle =
    upcoming.length === 0
      ? t("noUpcoming")
      : upcoming.length === 1
      ? t("oneUpcoming")
      : t("manyUpcoming", { count: upcoming.length });

  const joinMeetLabel = t("joinMeet");
  const addToCalendarLabel = t("addToCalendar");
  const watchRecordingLabel = t("watchRecording");

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">
          {t("title")}
        </h1>
        <p className="font-sans text-sm text-muted mt-1">{upcomingSubtitle}</p>
      </div>

      {/* Empty state: sem matrículas */}
      {courseIds.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <CalendarX className="w-10 h-10 text-muted/40" />
          <p className="font-sans text-sm text-muted">{t("noEnrollment")}</p>
          <Link
            href="/cursos"
            className="font-sans text-xs font-semibold px-4 py-2 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors mt-1"
          >
            {t("browseCourses")}
          </Link>
        </div>
      )}

      {/* Empty state: matriculado mas sem lives */}
      {courseIds.length > 0 && liveSessions.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <CalendarX className="w-10 h-10 text-muted/40" />
          <p className="font-sans text-sm text-muted">{t("noScheduled")}</p>
        </div>
      )}

      {/* Próximas */}
      {upcoming.length > 0 && (
        <section className="mb-10">
          <SectionLabel>{t("upcomingSection")}</SectionLabel>
          <div className="flex flex-col gap-3">
            {upcoming.map((s, i) => (
              <SessionCard
                key={s.id}
                session={s}
                index={i}
                joinMeetLabel={joinMeetLabel}
                addToCalendarLabel={addToCalendarLabel}
                watchRecordingLabel={watchRecordingLabel}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        </section>
      )}

      {/* Anteriores */}
      {past.length > 0 && (
        <section>
          <SectionLabel>{t("pastSection")}</SectionLabel>
          <div className="flex flex-col gap-3">
            {past.map((s, i) => (
              <SessionCard
                key={s.id}
                session={s}
                past
                index={i}
                joinMeetLabel={joinMeetLabel}
                addToCalendarLabel={addToCalendarLabel}
                watchRecordingLabel={watchRecordingLabel}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
