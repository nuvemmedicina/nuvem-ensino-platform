import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { traduzirItem } from "@/lib/i18n-content";
import Link from "next/link";
import Image from "next/image";
import { Award, BookOpen, ExternalLink, PlayCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

function fmtDuracao(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

type Aula = { id: string; title: string; duration: number | null; type: string; videoUrl: string | null; audioUrl: string | null; muxPlaybackId: string | null };

function tipoDaAula(a: Aula): "video" | "audio" | "aoVivo" | "gravacao" | "leitura" | "emBreve" {
  const temVideo = !!(a.muxPlaybackId || a.videoUrl);
  const aoVivo = a.type === "LIVE" || /encontro s[ií]ncrono/i.test(a.title);
  if (aoVivo) return temVideo ? "gravacao" : "aoVivo";
  if (temVideo) return "video";
  if (a.audioUrl) return "audio";
  if (a.type === "TEXT") return "leitura";
  return "emBreve";
}

export default async function MeusCursosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "novaArea.paginas.meusCursos" });
  const tc = await getTranslations({ locale, namespace: "novaArea.curso" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/cursos");

  const matriculasRaw = await prisma.enrollment.findMany({
    where: { userId: session.user.id, status: { in: ["ACTIVE", "COMPLETED"] } },
    orderBy: { enrolledAt: "desc" },
    select: {
      id: true,
      status: true,
      certificate: { select: { id: true } },
      progress: { select: { lessonId: true, completed: true } },
      course: {
        select: {
          slug: true,
          title: true,
          titleEs: true,
          titleEn: true,
          hours: true,
          contentUrl: true,
          thumbnailUrl: true,
          instructor: { select: { user: { select: { name: true, image: true } } } },
          modules: {
            orderBy: { order: "asc" },
            select: {
              releaseDate: true,
              topics: {
                orderBy: { order: "asc" },
                select: {
                  lessons: {
                    orderBy: { order: "asc" },
                    select: { id: true, title: true, titleEs: true, titleEn: true, duration: true, type: true, videoUrl: true, audioUrl: true, muxPlaybackId: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Títulos do curso e das aulas no idioma do aluno (vazio = português)
  const matriculas = matriculasRaw.map((m) => ({
    ...m,
    course: {
      ...traduzirItem(m.course, locale),
      modules: m.course.modules.map((mod) => ({
        ...mod,
        topics: mod.topics.map((tp) => ({ ...tp, lessons: tp.lessons.map((a) => traduzirItem(a, locale)) })),
      })),
    },
  }));

  const agora = new Date();
  const cursos = matriculas.map((m) => {
    const feitas = new Set(m.progress.filter((p) => p.completed).map((p) => p.lessonId));
    const todas = m.course.modules.flatMap((mod) => mod.topics.flatMap((tp) => tp.lessons));
    const proxima =
      m.course.modules
        .filter((mod) => !mod.releaseDate || mod.releaseDate <= agora)
        .flatMap((mod) => mod.topics.flatMap((tp) => tp.lessons))
        .find((a) => !feitas.has(a.id)) ?? null;
    const concluidas = todas.filter((a) => feitas.has(a.id)).length;
    return {
      m,
      total: todas.length,
      concluidas,
      pct: todas.length ? Math.round((concluidas / todas.length) * 100) : 0,
      proxima,
      externo: !!m.course.contentUrl && todas.length === 0,
    };
  });

  const emAndamento = cursos.filter((c) => c.m.status === "ACTIVE");
  const concluidos = cursos.filter((c) => c.m.status === "COMPLETED");

  // Função comum, não componente: um componente criado dentro do render seria
  // recriado a cada renderização.
  const linha = (c: (typeof cursos)[number]) => {
    const capa = c.m.course.thumbnailUrl ?? c.m.course.instructor.user.image;
    const concluido = c.m.status === "COMPLETED";
    return (
      <li key={c.m.id} className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-wrap gap-5 items-center">
        <Link href={`/dashboard/cursos/${c.m.course.slug}`} className="relative w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-canvas" tabIndex={-1} aria-hidden="true">
          {capa ? (
            <Image src={capa} alt="" fill sizes="240px" className="object-cover" />
          ) : (
            <BookOpen className="absolute inset-0 m-auto w-7 h-7 text-white/40" />
          )}
        </Link>

        <div className="flex-1 min-w-[min(100%,18rem)] flex flex-col gap-2">
          <Link href={`/dashboard/cursos/${c.m.course.slug}`} className="font-serif text-2xl font-medium text-foreground leading-snug hover:text-primary text-balance">
            {c.m.course.title}
          </Link>
          <p className="font-sans text-sm text-muted">
            {c.m.course.instructor.user.name} · {c.m.course.hours}h
          </p>

          {concluido ? (
            <p className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-green-800">
              <Award className="w-4 h-4" aria-hidden="true" />
              {t("concluido")}
            </p>
          ) : c.externo ? (
            <p className="font-sans text-sm text-muted">{t("externo")}</p>
          ) : (
            <>
              <div className="flex items-center gap-3 max-w-md">
                <span className="flex-1 h-1.5 rounded-full bg-border/60">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${c.pct}%` }} />
                </span>
                <span className="font-sans text-sm text-muted tabular-nums shrink-0">
                  {t("aulas", { feitas: c.concluidas, total: c.total })} · {c.pct}%
                </span>
              </div>
              {c.proxima ? (
                <p className="font-sans text-sm text-foreground">
                  <span className="text-muted">{t("proxima")}: </span>
                  {c.proxima.title.trim()}
                  <span className="text-muted">
                    {" "}· {tc(`tipo.${tipoDaAula(c.proxima)}`)}
                    {c.proxima.duration ? ` · ${fmtDuracao(c.proxima.duration)}` : ""}
                  </span>
                </p>
              ) : (
                <p className="font-sans text-sm text-muted">{t("tudoFeito")}</p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          {concluido && c.m.certificate ? (
            <Link
              href="/dashboard/certificados"
              className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full border border-amber-700/30 text-amber-900 font-sans text-sm font-semibold hover:bg-amber-50"
            >
              <Award className="w-4 h-4" aria-hidden="true" />
              {t("verCertificado")}
            </Link>
          ) : c.externo ? (
            <a
              href={c.m.course.contentUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-primary text-white font-sans text-sm font-semibold hover:bg-primary/90"
            >
              {t("entrarAula")}
              <ExternalLink className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
            </a>
          ) : (
            !concluido &&
            c.proxima && (
              <Link
                href={`/dashboard/cursos/${c.m.course.slug}/aulas/${c.proxima.id}`}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-primary text-white font-sans text-sm font-semibold hover:bg-primary/90"
              >
                <PlayCircle className="w-4 h-4" aria-hidden="true" />
                {c.concluidas > 0 ? t("continuar") : t("comecar")}
              </Link>
            )
          )}
          <Link
            href={`/dashboard/cursos/${c.m.course.slug}`}
            className="inline-flex items-center min-h-[44px] px-5 rounded-full border border-border text-foreground font-sans text-sm hover:border-primary/40"
          >
            {t("abrirCurso")}
          </Link>
        </div>
      </li>
    );
  };

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex flex-col gap-8">
        <div>
          <h1 className="font-serif text-4xl font-medium text-foreground leading-tight">{t("titulo")}</h1>
          {cursos.length > 0 && <p className="font-sans text-[15px] text-muted mt-1">{t("subtitulo", { count: cursos.length })}</p>}
        </div>

        {cursos.length === 0 ? (
          <section className="bg-surface border border-border rounded-2xl px-6 py-12 flex flex-col items-center text-center gap-3">
            <BookOpen className="w-10 h-10 text-muted/50" aria-hidden="true" />
            <p className="font-serif text-2xl text-foreground">{t("vazioTitulo")}</p>
            <p className="font-sans text-sm text-muted">{t("vazioTexto")}</p>
            <Link href="/cursos" className="mt-2 inline-flex items-center min-h-[48px] px-6 rounded-full bg-primary text-white font-sans text-sm font-semibold">
              {t("verCatalogo")}
            </Link>
          </section>
        ) : (
          <>
            {emAndamento.length > 0 && (
              <section aria-labelledby="em-andamento" className="flex flex-col gap-3">
                <h2 id="em-andamento" className="font-sans text-lg font-semibold text-foreground">{t("emAndamento")}</h2>
                <ul className="flex flex-col gap-3">
                  {emAndamento.map(linha)}
                </ul>
              </section>
            )}
            {concluidos.length > 0 && (
              <section aria-labelledby="concluidos" className="flex flex-col gap-3">
                <h2 id="concluidos" className="font-sans text-lg font-semibold text-foreground">{t("concluidos")}</h2>
                <ul className="flex flex-col gap-3">
                  {concluidos.map(linha)}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
