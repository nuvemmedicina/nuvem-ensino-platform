import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Calendar, CalendarX, MapPin, PlayCircle, Radio, Unlock, Video } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Agenda do aluno: aulas ao vivo e liberações de módulo dos cursos em que ele
 * está matriculado, numa lista por data. Antes eram cartazes com a mesma foto
 * repetida, o que escondia a informação que importa (dia e hora).
 */

const FUSO = "America/Sao_Paulo";

function linkAgenda(s: { title: string; startAt: Date; endAt: Date; meetUrl: string | null; location: string | null; course: { title: string } }) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: "TEMPLATE",
    text: s.title,
    dates: `${fmt(s.startAt)}/${fmt(s.endAt)}`,
    details: s.meetUrl ? `Link: ${s.meetUrl}` : s.course.title,
    location: s.location ?? s.meetUrl ?? "",
  }).toString()}`;
}

export default async function AgendaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "novaArea.paginas.agenda" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/aulas-ao-vivo");

  const dl = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";

  // O link do Meet e a gravação são do curso: o aluno só vê os encontros dos
  // cursos em que está matriculado. A equipe vê todos.
  const role = (session.user as { role?: string }).role;
  const cuidaDoConteudo = role === "ADMIN" || role === "EDITOR" || role === "INSTRUCTOR";
  const filtroCurso = cuidaDoConteudo
    ? { status: "PUBLISHED" as const }
    : {
        status: "PUBLISHED" as const,
        enrollments: { some: { userId: session.user.id, status: { in: ["ACTIVE" as const, "COMPLETED" as const] } } },
      };

  const agora = new Date();
  const [encontros, liberacoes] = await Promise.all([
    prisma.liveSession.findMany({
      where: { course: filtroCurso },
      include: { course: { select: { title: true, slug: true } } },
      orderBy: { startAt: "asc" },
    }),
    prisma.module.findMany({
      where: { releaseDate: { gt: agora }, course: filtroCurso },
      select: { id: true, title: true, releaseDate: true, course: { select: { title: true, slug: true } } },
      orderBy: { releaseDate: "asc" },
    }),
  ]);

  type Item =
    | { tipo: "aoVivo"; quando: Date; s: (typeof encontros)[number] }
    | { tipo: "liberacao"; quando: Date; m: (typeof liberacoes)[number] };

  const proximos: Item[] = [
    ...encontros.filter((s) => s.endAt >= agora).map((s) => ({ tipo: "aoVivo" as const, quando: s.startAt, s })),
    ...liberacoes.map((m) => ({ tipo: "liberacao" as const, quando: m.releaseDate!, m })),
  ].sort((a, b) => a.quando.getTime() - b.quando.getTime());
  const anteriores = encontros.filter((s) => s.endAt < agora).reverse();

  const fmtMes = new Intl.DateTimeFormat(dl, { month: "long", year: "numeric", timeZone: FUSO });
  const fmtSemana = new Intl.DateTimeFormat(dl, { weekday: "short", timeZone: FUSO });
  const fmtDia = new Intl.DateTimeFormat(dl, { day: "numeric", timeZone: FUSO });
  const fmtMesCurto = new Intl.DateTimeFormat(dl, { month: "short", timeZone: FUSO });
  const fmtHora = new Intl.DateTimeFormat(dl, { hour: "2-digit", minute: "2-digit", timeZone: FUSO });
  const fmtData = new Intl.DateTimeFormat(dl, { day: "numeric", month: "short", year: "numeric", timeZone: FUSO });

  // Agrupa os próximos por mês, mantendo a ordem
  const porMes: { mes: string; itens: Item[] }[] = [];
  for (const item of proximos) {
    const mes = fmtMes.format(item.quando);
    const grupo = porMes.at(-1);
    if (grupo?.mes === mes) grupo.itens.push(item);
    else porMes.push({ mes, itens: [item] });
  }
  const primeiroAoVivo = proximos.find((i) => i.tipo === "aoVivo");

  const blocoData = (d: Date, destaque: boolean) => (
    <span className={`w-16 shrink-0 rounded-xl py-2 text-center ${destaque ? "bg-canvas text-white" : "bg-background text-foreground"}`}>
      <span className={`block font-sans text-xs font-semibold uppercase ${destaque ? "text-white/70" : "text-muted"}`}>
        {fmtSemana.format(d).replace(".", "")}
      </span>
      <span className="block font-sans text-2xl font-semibold tabular-nums leading-tight">{fmtDia.format(d)}</span>
      <span className={`block font-sans text-xs uppercase ${destaque ? "text-white/70" : "text-muted"}`}>
        {fmtMesCurto.format(d).replace(".", "")}
      </span>
    </span>
  );

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex flex-col gap-8">
        <div>
          <h1 className="font-serif text-4xl font-medium text-foreground leading-tight">{t("titulo")}</h1>
          <p className="font-sans text-[15px] text-muted mt-1">{t("subtitulo")}</p>
        </div>

        {proximos.length === 0 && anteriores.length === 0 && (
          <section className="bg-surface border border-border rounded-2xl px-6 py-12 flex flex-col items-center text-center gap-3">
            <CalendarX className="w-10 h-10 text-muted/50" aria-hidden="true" />
            <p className="font-sans text-[15px] text-muted">{t("vazio")}</p>
          </section>
        )}

        {porMes.map((grupo) => (
          <section key={grupo.mes} className="flex flex-col gap-3">
            <h2 className="font-sans text-lg font-semibold text-foreground first-letter:uppercase">{grupo.mes}</h2>
            <ul className="flex flex-col gap-3">
              {grupo.itens.map((item) => {
                if (item.tipo === "liberacao") {
                  return (
                    <li key={item.m.id} className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4">
                      {blocoData(item.quando, false)}
                      <div className="flex-1 min-w-[min(100%,14rem)] flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-amber-900">
                          <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                          {t("liberacao")}
                        </span>
                        <span className="font-sans text-[17px] font-semibold text-foreground">{item.m.title}</span>
                        <span className="font-sans text-sm text-muted">
                          {item.m.course.title} · {t("liberacaoTexto")}
                        </span>
                      </div>
                    </li>
                  );
                }
                const s = item.s;
                const destaque = item === primeiroAoVivo;
                const acontecendo = s.startAt <= agora && s.endAt >= agora;
                return (
                  <li
                    key={s.id}
                    className={`rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4 ${
                      destaque ? "bg-surface border-2 border-primary/40" : "bg-surface border border-border"
                    }`}
                  >
                    {blocoData(s.startAt, destaque)}
                    <div className="flex-1 min-w-[min(100%,14rem)] flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-primary">
                        <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                        {acontecendo ? t("acontecendo") : destaque ? t("proximo") : t("aoVivo")}
                      </span>
                      <span className="font-sans text-[17px] font-semibold text-foreground">{s.title}</span>
                      <span className="font-sans text-sm text-muted">
                        {t("horario", { inicio: fmtHora.format(s.startAt), fim: fmtHora.format(s.endAt) })}
                      </span>
                      <span className="font-sans text-sm text-muted">{s.course.title}</span>
                      {s.location && (
                        <span className="inline-flex items-center gap-1.5 font-sans text-sm text-muted">
                          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                          {s.location}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                      {s.meetUrl && (
                        <a
                          href={s.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full font-sans text-sm font-semibold ${
                            destaque ? "bg-primary text-white hover:bg-primary/90" : "border border-primary/30 text-primary hover:bg-primary/5"
                          }`}
                        >
                          <Video className="w-4 h-4" aria-hidden="true" />
                          {t("entrarMeet")}
                        </a>
                      )}
                      <a
                        href={linkAgenda(s)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full border border-border text-foreground font-sans text-sm hover:border-primary/40"
                      >
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        {t("agenda")}
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {anteriores.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-sans text-lg font-semibold text-foreground">{t("anteriores")}</h2>
            <ul className="bg-surface border border-border rounded-2xl">
              {anteriores.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 border-b border-border last:border-b-0">
                  <span className="w-28 shrink-0 font-sans text-sm text-muted tabular-nums">{fmtData.format(s.startAt)}</span>
                  <span className="flex-1 min-w-[min(100%,12rem)] flex flex-col">
                    <span className="font-sans text-[15px] text-foreground">{s.title}</span>
                    <span className="font-sans text-xs text-muted">{s.course.title}</span>
                  </span>
                  {s.recordingUrl ? (
                    <a
                      href={s.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 min-h-[44px] font-sans text-sm font-semibold text-primary hover:underline"
                    >
                      <PlayCircle className="w-4 h-4" aria-hidden="true" />
                      {t("gravacao")}
                    </a>
                  ) : (
                    <Link
                      href={`/dashboard/cursos/${s.course.slug}?aba=aulas`}
                      className="inline-flex items-center gap-1.5 min-h-[44px] font-sans text-sm text-primary hover:underline"
                    >
                      <PlayCircle className="w-4 h-4" aria-hidden="true" />
                      {t("gravacaoNoCurso")}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
