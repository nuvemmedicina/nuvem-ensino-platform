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

function SessionCard({
  session: s,
  past = false,
  joinMeetLabel,
  addToCalendarLabel,
  watchRecordingLabel,
  dateLocale,
}: {
  session: SessionData;
  past?: boolean;
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
    timeZone: "America/Sao_Paulo",
  });
  const fmtTime = new Intl.DateTimeFormat(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  const cover = s.thumbnailUrl ?? "/aula-ao-vivo.png";

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 ${
        past ? "opacity-50 grayscale" : "hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/15"
      }`}
      style={{ background: "var(--color-surface)" }}
    >
      {/* Poster */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0e4f6b] to-[#1a8fa8]" style={{ paddingBottom: "140%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={s.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badge AO VIVO */}
        {!past && (
          <span className="absolute top-3 left-3 flex items-center gap-1 font-sans text-[9px] font-bold uppercase tracking-widest bg-primary text-white px-2 py-1 rounded-full shadow-lg">
            <Radio className="w-2.5 h-2.5" />
            ao vivo
          </span>
        )}

        {/* Info sobreposta */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="font-sans text-[9px] font-bold uppercase tracking-widest text-white/60 mb-1 line-clamp-2">
            {s.course.title}
          </p>
          <p className="font-sans text-sm font-bold text-white leading-snug line-clamp-2 mb-2">
            {s.title}
          </p>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1 font-sans text-[10px] text-white/70">
              <Calendar className="w-3 h-3 shrink-0" />
              <span className="capitalize">{fmtDate.format(new Date(s.startAt))}</span>
              <span className="text-white/40">·</span>
              <span>{fmtTime.format(new Date(s.startAt))}</span>
            </span>
            {s.location && (
              <span className="flex items-center gap-1 font-sans text-[10px] text-white/60">
                <MapPin className="w-3 h-3 shrink-0" />
                {s.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex flex-col gap-2 p-3">
        {!past && s.meetUrl && (
          <a
            href={s.meetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center font-sans text-xs font-bold px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
          >
            {joinMeetLabel}
          </a>
        )}
        {!past && (
          <a
            href={calUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center font-sans text-[11px] font-semibold px-4 py-2 rounded-xl border border-border text-muted hover:text-foreground hover:border-primary/40 transition-colors"
          >
            {addToCalendarLabel}
          </a>
        )}
        {past && s.recordingUrl && (
          <a
            href={s.recordingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 font-sans text-xs font-bold px-4 py-2.5 rounded-xl bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            {watchRecordingLabel}
          </a>
        )}
      </div>
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

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    select: { courseId: true },
  });

  const courseIds = enrollments.map((e) => e.courseId);

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
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {upcoming.map((s, i) => (
              <SessionCard
                key={s.id}
                session={s}
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
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {past.map((s, i) => (
              <SessionCard
                key={s.id}
                session={s}
                past
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
