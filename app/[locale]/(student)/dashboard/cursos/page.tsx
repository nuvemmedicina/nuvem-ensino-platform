import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Play, Award, BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";

function calcProgress(progress: { completed: boolean }[], totalLessons: number) {
  if (totalLessons === 0) return 0;
  return Math.round((progress.filter((p) => p.completed).length / totalLessons) * 100);
}

export default async function MeusCursosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.courses" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/cursos");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id, status: { in: ["ACTIVE", "COMPLETED"] } },
    include: {
      course: {
        include: {
          instructor: { include: { user: { select: { name: true, image: true } } } },
          modules: { include: { lessons: { select: { id: true } } } },
        },
      },
      progress: { select: { lessonId: true, completed: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const active    = enrollments.filter((e) => e.status === "ACTIVE");
  const completed = enrollments.filter((e) => e.status === "COMPLETED");

  if (enrollments.length === 0) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-medium text-foreground mb-8">{t("title")}</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border rounded-2xl">
          <BookOpen className="w-12 h-12 text-muted/30 mb-4" />
          <p className="font-serif text-xl text-foreground/40 mb-2">{t("emptyTitle")}</p>
          <p className="font-sans text-sm text-muted mb-6">{t("emptyDesc")}</p>
          <Link href="/cursos" className="font-sans text-sm font-semibold px-6 py-3 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors">
            {t("viewCourses")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* ── Em andamento ── */}
      {active.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-medium text-foreground mb-6">Em andamento</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {active.map((e) => {
              const total = e.course.modules.reduce((s, m) => s + m.lessons.length, 0);
              const pct   = calcProgress(e.progress, total);
              return <PosterCard key={e.id} enrollment={e} pct={pct} total={total} />;
            })}
          </div>
        </section>
      )}

      {/* ── Concluídos ── */}
      {completed.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-medium text-foreground mb-6">Concluídos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {completed.map((e) => {
              const total = e.course.modules.reduce((s, m) => s + m.lessons.length, 0);
              return <PosterCard key={e.id} enrollment={e} pct={100} total={total} done />;
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Componente de pôster ───────────────────────────────────────────────────────
function PosterCard({
  enrollment: e,
  pct,
  total,
  done,
}: {
  enrollment: {
    course: {
      slug: string;
      title: string;
      hours: number;
      thumbnailUrl: string | null;
      instructor: { user: { name: string | null; image: string | null } };
    };
  };
  pct: number;
  total: number;
  done?: boolean;
}) {
  const thumb = e.course.thumbnailUrl ?? e.course.instructor.user.image;

  return (
    <Link
      href={`/dashboard/cursos/${e.course.slug}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-[#1c1c1c] border border-white/10"
    >
      {/* Poster image — proporção 2:3 */}
      <div className="relative w-full" style={{ paddingBottom: "140%" }}>
        {thumb ? (
          <Image
            src={thumb}
            alt={e.course.title}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-canvas flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-primary/40" />
          </div>
        )}

        {/* Gradiente inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badge concluído */}
        {done && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-green-500 text-white font-sans text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            <Award className="w-3 h-3" /> Concluído
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-white/95 shadow-lg flex items-center justify-center">
            <Play className="w-5 h-5 fill-primary text-primary ml-0.5" />
          </div>
        </div>

        {/* Título sobre o gradiente */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-sans text-xs font-semibold text-white leading-snug line-clamp-2 drop-shadow">
            {e.course.title}
          </h3>
        </div>
      </div>

      {/* Rodapé */}
      <div className="px-3 pt-2.5 pb-3 bg-[#1c1c1c]">
        <p className="font-sans text-[10px] text-muted truncate mb-2">
          {e.course.instructor.user.name} · {e.course.hours}h
          {total > 0 && ` · ${total} aulas`}
        </p>

        {/* Barra de progresso */}
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${done ? "bg-green-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!done && pct > 0 && (
          <p className="font-sans text-[10px] text-muted mt-1">{pct}% concluído</p>
        )}
      </div>
    </Link>
  );
}
