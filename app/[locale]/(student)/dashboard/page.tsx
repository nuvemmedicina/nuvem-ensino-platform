import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronRight, Award, Info, ShoppingCart, BookOpen, Layers } from "lucide-react";
import { getTranslations } from "next-intl/server";

async function getDashboardData(userId: string) {
  const [enrollments, certificates, allCourses, flashcardGroups] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
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
    }),
    prisma.certificate.findMany({
      where: { userId },
      include: {
        enrollment: {
          include: { course: { select: { title: true, slug: true, thumbnailUrl: true } } },
        },
      },
      orderBy: { issueDate: "desc" },
    }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      include: {
        instructor: { include: { user: { select: { name: true, image: true } } } },
        modules: { include: { lessons: { select: { id: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.flashcardGroup.findMany({
      include: { _count: { select: { cards: true } }, course: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  return { enrollments, certificates, allCourses, flashcardGroups };
}

function calcProgress(progress: { completed: boolean }[], totalLessons: number): number {
  if (totalLessons === 0) return 0;
  return Math.round((progress.filter((p) => p.completed).length / totalLessons) * 100);
}

function fmtPrice(price: unknown): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard");
  const { enrollments, certificates, allCourses, flashcardGroups } = await getDashboardData(session.user.id);

  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE");
  const completedEnrollments = enrollments.filter((e) => e.status === "COMPLETED");
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course.id));
  const firstName = session.user?.name?.split(" ")[0] ?? "";

  const heroEnrollment = activeEnrollments[0] ?? completedEnrollments[0] ?? null;
  const heroTotalLessons = heroEnrollment
    ? heroEnrollment.course.modules.reduce((s, m) => s + m.lessons.length, 0)
    : 0;
  const heroPct = heroEnrollment ? calcProgress(heroEnrollment.progress, heroTotalLessons) : 0;

  const catalogCourses = allCourses.filter((c) => !enrolledCourseIds.has(c.id));

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 min-h-screen bg-white">

      {/* ── HERO ── */}
      {heroEnrollment ? (
        <div className="relative w-full" style={{ aspectRatio: "21/9", minHeight: 260, maxHeight: 480 }}>
          {heroEnrollment.course.thumbnailUrl ? (
            <Image src={heroEnrollment.course.thumbnailUrl} alt={heroEnrollment.course.title}
              fill className="object-cover" style={{ objectPosition: "center 20%" }} priority sizes="100vw" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-canvas to-primary/30" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end px-6 lg:px-12 pb-8 lg:pb-12">
            <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5">
              {heroEnrollment.status === "COMPLETED" ? "Concluído" : "Continue assistindo"}
            </p>
            <h1 className="font-serif text-2xl lg:text-4xl font-medium text-white max-w-xl leading-tight mb-3">
              {heroEnrollment.course.title}
            </h1>
            {heroTotalLessons > 0 && (
              <div className="mb-4 max-w-xs">
                <div className="flex justify-between font-sans text-[10px] text-white/50 mb-1">
                  <span>{heroPct}% concluído</span>
                  <span>{heroTotalLessons} aulas</span>
                </div>
                <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${heroPct}%` }} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Link href={`/dashboard/cursos/${heroEnrollment.course.slug}`}
                className="flex items-center gap-2 font-sans text-sm font-bold px-5 py-2.5 rounded-full bg-white text-black hover:bg-white/90 transition-all">
                <Play className="w-4 h-4 fill-black" />
                {heroPct > 0 ? "Continuar" : "Assistir"}
              </Link>
              <Link href={`/cursos/${heroEnrollment.course.slug}`}
                className="flex items-center gap-2 font-sans text-sm font-semibold px-5 py-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all">
                <Info className="w-4 h-4" /> Detalhes
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "21/9", minHeight: 260, maxHeight: 480 }}>
          <Image src="/capa.webp" alt="Nuvem Ensino" fill className="object-cover"
            style={{ objectPosition: "center center" }} priority sizes="100vw" />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end px-6 lg:px-12 pb-8 lg:pb-12">
            <h1 className="font-serif text-3xl lg:text-5xl font-medium text-white mb-1.5 leading-tight">
              Olá, {firstName}
            </h1>
            <p className="font-sans text-sm text-white/60 mb-5">Explore nossa grade de formações médicas</p>
            <Link href="/cursos" className="flex items-center gap-2 font-sans text-sm font-bold px-5 py-2.5 rounded-full bg-white text-black hover:bg-white/90 transition-all w-fit">
              <Play className="w-4 h-4 fill-black" /> Ver catálogo
            </Link>
          </div>
        </div>
      )}

      {/* ── CONTEÚDO ── */}

      {/* Stats chips — fundo branco */}
      <div className="px-4 lg:px-10 py-6 bg-white flex items-center gap-2.5 flex-wrap">
        {[
          { label: `${activeEnrollments.length} em andamento`, color: "text-primary", bg: "bg-primary/8 border-primary/20" },
          { label: `${completedEnrollments.length} concluídos`, color: "text-green-700", bg: "bg-green-500/10 border-green-500/20" },
          { label: `${certificates.length} certificados`, color: "text-amber-700", bg: "bg-amber-500/10 border-amber-500/20" },
        ].map(({ label, color, bg }) => (
          <span key={label} className={`font-sans text-xs font-semibold ${color} ${bg} border px-3 py-1.5 rounded-full`}>
            {label}
          </span>
        ))}
      </div>

      {/* ── Continuar assistindo — fundo cinza ── */}
      {activeEnrollments.length > 0 && (
        <section className="px-4 lg:px-10 py-10 bg-background">
          <SectionHeader title="Continuar assistindo" href="/dashboard/cursos" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeEnrollments.map((e) => {
              const total = e.course.modules.reduce((s, m) => s + m.lessons.length, 0);
              const pct = calcProgress(e.progress, total);
              return (
                <NetflixCourseCard
                  key={e.id}
                  href={`/dashboard/cursos/${e.course.slug}`}
                  title={e.course.title}
                  thumbnail={e.course.thumbnailUrl ?? e.course.instructor.user.image}
                  instructorName={e.course.instructor.user.name}
                  pct={pct}
                  hours={e.course.hours}
                  enrolled
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ── Cursos concluídos — fundo branco ── */}
      {completedEnrollments.length > 0 && (
        <section className="px-4 lg:px-10 py-10 bg-white">
          <SectionHeader title="Cursos concluídos" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {completedEnrollments.map((e) => (
              <NetflixCourseCard
                key={e.id}
                href={`/dashboard/cursos/${e.course.slug}`}
                title={e.course.title}
                thumbnail={e.course.thumbnailUrl ?? e.course.instructor.user.image}
                instructorName={e.course.instructor.user.name}
                pct={100}
                hours={e.course.hours}
                enrolled
                completed
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Grade de Cursos — fundo cinza ── */}
      {catalogCourses.length > 0 && (
        <section className="px-4 lg:px-10 py-10 bg-background">
          <SectionHeader
            title="Grade de Cursos"
            subtitle="Amplie sua formação médica"
            href="/cursos"
            hrefLabel="Ver todos"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {catalogCourses.map((course) => (
              <NetflixCourseCard
                key={course.id}
                href={`/cursos/${course.slug}`}
                title={course.title}
                thumbnail={course.thumbnailUrl ?? course.instructor.user.image}
                instructorName={course.instructor.user.name}
                hours={course.hours}
                price={fmtPrice(course.salePrice ?? course.price)}
                salePrice={course.salePrice ? fmtPrice(course.price) : undefined}
                enrolled={false}
                large
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Flashcards — fundo branco ── */}
      {flashcardGroups.length > 0 && (
        <section className="px-4 lg:px-10 py-10 bg-white">
          <SectionHeader
            title="Flashcards"
            subtitle="Fixe o conteúdo com repetição espaçada"
            href="/dashboard/flashcards"
            hrefLabel="Ver todos"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {flashcardGroups.map((group) => (
              <Link
                key={group.id}
                href={`/dashboard/flashcards/${group.id}`}
                className="group flex flex-col rounded-2xl border border-border bg-white hover:border-primary/30 hover:shadow-lg hover:shadow-primary/8 transition-all duration-200 overflow-hidden"
              >
                <div className="h-20 bg-gradient-to-br from-[#0e4f6b] to-[#1a8fa8] flex items-center justify-center">
                  <Layers className="w-8 h-8 text-white/60" />
                </div>
                <div className="p-4 flex-1 flex flex-col gap-1">
                  <p className="font-sans text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {group.title}
                  </p>
                  {group.course && (
                    <p className="font-sans text-[10px] text-muted line-clamp-1">{group.course.title}</p>
                  )}
                  <p className="font-sans text-[10px] font-bold text-primary/70 mt-auto pt-2">
                    {group._count.cards} {group._count.cards === 1 ? "card" : "cards"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Certificados — fundo cinza ── */}
      {certificates.length > 0 && (
        <section className="px-4 lg:px-10 py-10 bg-background">
          <SectionHeader
            title="Meus Certificados"
            subtitle="Conquistas da sua formação"
            href="/dashboard/certificados"
            hrefLabel="Ver todos"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {certificates.map((cert) => (
              <Link
                key={cert.id}
                href={`/dashboard/certificados`}
                className="group flex flex-col rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200 overflow-hidden"
              >
                <div className="h-24 bg-gradient-to-br from-amber-400/20 to-amber-600/10 flex items-center justify-center relative overflow-hidden">
                  {cert.enrollment.course.thumbnailUrl && (
                    <Image src={cert.enrollment.course.thumbnailUrl} alt={cert.enrollment.course.title} fill
                      className="object-cover opacity-30" sizes="(max-width: 640px) 50vw, 25vw" />
                  )}
                  <Award className="w-10 h-10 text-amber-500 relative z-10" />
                </div>
                <div className="p-3 flex flex-col gap-1">
                  <p className="font-sans text-xs font-bold text-amber-700 uppercase tracking-widest">Certificado</p>
                  <p className="font-sans text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                    {cert.enrollment.course.title}
                  </p>
                  <p className="font-sans text-[10px] text-muted mt-1">
                    {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(cert.issueDate))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Suporte WhatsApp — fundo branco ── */}
      <div className="px-4 lg:px-10 py-8 bg-white flex items-center justify-between">
        <div>
          <p className="font-sans text-sm font-semibold text-foreground">Precisa de ajuda?</p>
          <p className="font-sans text-xs text-muted mt-0.5">Nossa equipe está disponível pelo WhatsApp</p>
        </div>
        <a
          href="https://wa.me/5531722910291"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-sans text-sm font-bold text-white bg-green-500 hover:bg-green-600 transition-colors px-4 py-2.5 rounded-xl shrink-0 ml-4 shadow-md shadow-green-500/20"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Suporte
        </a>
      </div>

      {/* Vazio total */}
      {enrollments.length === 0 && catalogCourses.length === 0 && (
        <div className="px-4 lg:px-10 flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="w-10 h-10 text-muted/40 mb-4" />
          <p className="font-serif text-2xl text-muted mb-2">Nenhum conteúdo disponível</p>
          <p className="font-sans text-sm text-muted/70">Os cursos aparecerão aqui assim que forem publicados.</p>
        </div>
      )}

    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({
  title, subtitle, href, hrefLabel = "Ver todos",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="font-sans text-lg font-bold text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="font-sans text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 font-sans text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 ml-4">
          {hrefLabel} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// ── Netflix Course Card ───────────────────────────────────────────────────────
function NetflixCourseCard({
  href, title, thumbnail, instructorName, pct, hours, enrolled, completed, price, salePrice, large,
}: {
  href: string;
  title: string;
  thumbnail: string | null | undefined;
  instructorName: string | null | undefined;
  pct?: number;
  hours: number;
  enrolled: boolean;
  completed?: boolean;
  price?: string;
  salePrice?: string;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/15 bg-white border border-border/40"
    >
      {/* Poster */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0e4f6b] to-[#1a8fa8]" style={{ paddingBottom: "140%" }}>
        {thumbnail ? (
          <Image src={thumbnail} alt={title} fill
            className="absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={large
              ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              : "(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
            } />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-8 h-8 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badge */}
        {completed && (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 font-sans text-[9px] font-bold uppercase tracking-widest bg-green-500 text-white px-2 py-1 rounded-full shadow">
            <Award className="w-2.5 h-2.5" /> Concluído
          </span>
        )}
        {!enrolled && price && (
          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-0.5">
            <span className="font-sans text-xs font-black text-white bg-primary/90 backdrop-blur-sm px-2 py-0.5 rounded-lg shadow">
              {price}
            </span>
            {salePrice && (
              <span className="font-sans text-[9px] text-white/60 line-through">{salePrice}</span>
            )}
          </div>
        )}

        {/* Info sobreposta */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="font-sans text-[9px] font-bold uppercase tracking-widest text-white/55 mb-0.5">
            {instructorName} · {hours}h
          </p>
          <p className="font-sans text-sm font-bold text-white leading-snug line-clamp-2">
            {title}
          </p>
          {pct !== undefined && pct > 0 && pct < 100 && (
            <div className="mt-2 h-0.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* CTA para não-matriculados */}
      {!enrolled && (
        <div className="px-3 py-2.5 bg-white border-t border-border/40">
          <span className="flex items-center justify-center gap-1.5 font-sans text-[11px] font-bold text-primary">
            <ShoppingCart className="w-3 h-3" /> Ver curso
          </span>
        </div>
      )}
    </Link>
  );
}
