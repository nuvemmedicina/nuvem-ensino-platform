import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Clock,
  Users,
  MapPin,
  CheckCircle,
  Calendar,
  BookOpen,
  Award,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { localizedCourse } from "@/lib/i18n-content";
import { auth } from "@/auth";
import ShareButton from "./ShareButton";


type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

// Força renderização dinâmica: a página verifica matrícula por sessão do usuário
// e não pode ser pré-gerada estaticamente
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { instructor: { include: { user: true } } },
  });
  if (!course) return {};

  const lc = localizedCourse(course, locale);
  const description =
    course.metaDesc ??
    lc.shortDesc ??
    `Curso ${lc.title} — ${course.hours}h de formação prática com especialistas. Certificação ISO 9001 pela NU.V.E.M ENSINO.`;

  const ogImage = course.thumbnailUrl
    ? { url: course.thumbnailUrl, width: 1200, height: 630, alt: lc.title }
    : { url: `/cursos/${slug}/opengraph-image`, width: 1200, height: 630, alt: lc.title };

  const canonicalPt = `/cursos/${slug}`;
  const canonicalEn = `/en/courses/${slug}`;
  const canonicalEs = `/es/cursos/${slug}`;
  const canonical = locale === "en" ? canonicalEn : locale === "es" ? canonicalEs : canonicalPt;

  return {
    title: course.metaTitle ?? `${lc.title} | NU.V.E.M ENSINO`,
    description,
    alternates: {
      canonical,
      languages: {
        pt: canonicalPt,
        en: canonicalEn,
        es: canonicalEs,
        "x-default": canonicalPt,
      },
    },
    openGraph: {
      type: "website",
      title: lc.title,
      description,
      url: canonical,
      images: [ogImage],
      locale: locale === "en" ? "en_US" : locale === "es" ? "es_ES" : "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title: lc.title,
      description,
      images: [ogImage.url],
    },
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "coursePage" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      instructor: { include: { user: true } },
      tags: { include: { tag: true } },
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" }, select: { title: true, id: true } } },
      },
    },
  });

  if (!course) notFound();

  // Verificar se o usuário está matriculado (para liberar vídeo de aula)
  const session = await auth();
  const isEnrolled = session?.user?.id
    ? !!(await prisma.enrollment.findFirst({
        where: {
          userId: session.user.id,
          courseId: course.id,
          status: { in: ["ACTIVE", "COMPLETED"] },
        },
        select: { id: true },
      }))
    : false;

  const lc = localizedCourse(course, locale);
  const splitLines = (s: string | null | undefined) =>
    s ? s.split("\n").map((l) => l.trim()).filter(Boolean) : null;

  const content = {
    startDate:      course.startDateLabel ?? null,
    objectives:     splitLines(course.objectives)     ?? null,
    targetAudience: splitLines(course.targetAudience) ?? null,
    includes:       splitLines(course.includes)       ?? null,
    instructorBio:  course.instructor.bio             ?? null,
  };

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nuvemensino.com.br";
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: lc.title,
    description: lc.description,
    url: `${APP_URL}/cursos/${course.slug}`,
    image: course.thumbnailUrl ?? `${APP_URL}/og-image.png`,
    provider: {
      "@type": "EducationalOrganization",
      name: "NU.V.E.M ENSINO",
      url: APP_URL,
      sameAs: APP_URL,
    },
    instructor: {
      "@type": "Person",
      name: course.instructor.user.name ?? "",
      jobTitle: course.instructor.title ?? "",
    },
    offers: {
      "@type": "Offer",
      price: Number(course.price).toFixed(2),
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `${APP_URL}/checkout/${course.slug}`,
    },
    ...(course.hours ? { timeRequired: `PT${course.hours}H` } : {}),
    ...(course.location ? { locationCreated: { "@type": "Place", name: course.location } } : {}),
    inLanguage: "pt-BR",
    courseMode: course.category === "ONLINE" ? "online" : "onsite",
  };
  const reservedPct =
    course.totalSeats && course.totalSeats > 0
      ? Math.round(((course.reservedSeats ?? 0) / course.totalSeats) * 100)
      : 0;
  const availableSeats =
    course.totalSeats !== null
      ? course.totalSeats - (course.reservedSeats ?? 0)
      : null;
  const categoryLabel =
    course.category === "HANDS_ON"
      ? "Hands-On"
      : course.category === "ONLINE"
      ? "Online"
      : "Híbrido";
  const primaryTag = course.tags[0]?.tag.name;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      {/* ── Hero do curso ── */}
      <section className="bg-canvas px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb + Share */}
          <div className="flex items-center justify-between mb-8">
            <nav className="flex items-center gap-1.5 font-sans text-xs text-white/40">
              <Link href="/" className="hover:text-white/70 transition-colors">{locale === "en" ? "Home" : locale === "es" ? "Inicio" : "Início"}</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/cursos" className="hover:text-white/70 transition-colors">{tNav("courses")}</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/60 truncate max-w-[120px] sm:max-w-none">{lc.title}</span>
            </nav>
            <ShareButton
              title={lc.title}
              url={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://nuvemensino.com.br"}/cursos/${course.slug}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 items-start">
            {/* Info principal */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-accent bg-primary/60 border border-accent/20 px-3 py-1 rounded-full">
                  {categoryLabel}
                </span>
                {primaryTag && (
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-white/50">
                    {primaryTag}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl font-light text-white leading-tight mb-4">
                {lc.title}
              </h1>
              <p className="font-sans text-base text-white/60 leading-relaxed max-w-2xl mb-8">
                {lc.description}
              </p>

              <div className="flex flex-wrap gap-6 text-white/70">
                {content.startDate && (
                  <span className="flex items-center gap-2 font-sans text-sm">
                    <Calendar className="w-4 h-4 text-accent/70" />
                    {content.startDate}
                  </span>
                )}
                {availableSeats !== null && (
                  <span className="flex items-center gap-2 font-sans text-sm">
                    <Users className="w-4 h-4 text-accent/70" />
                    {availableSeats === 1
                      ? t("availableSeats", { count: availableSeats })
                      : t("availableSeatsPlural", { count: availableSeats })}
                  </span>
                )}
                {course.location && (
                  <span className="flex items-center gap-2 font-sans text-sm">
                    <MapPin className="w-4 h-4 text-accent/70" />
                    {course.location}
                  </span>
                )}
              </div>
            </div>

            {/* Card de inscrição */}
            <div className="lg:sticky lg:top-24">
              <div
                className="rounded-2xl border border-white/10 p-6"
                style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}
              >
                <p className="font-serif text-4xl font-semibold text-accent mb-1">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(course.price))}
                </p>
                <p className="font-sans text-xs text-white/40 mb-6">
                  {course.category === "ONLINE"
                    ? "Acesso completo ao curso"
                    : "Por pessoa, inclui todos os módulos"}
                </p>

                {course.totalSeats && reservedPct > 0 && (
                  <div className="mb-5">
                    <div className="flex justify-between font-sans text-[11px] text-white/50 mb-1.5">
                      <span>Reservas</span>
                      <span>{reservedPct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent/60 rounded-full"
                        style={{ width: `${reservedPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {course.externalCheckoutUrl ? (
                  <>
                    <a
                      href={course.externalCheckoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full text-center font-sans text-sm font-semibold px-6 py-3.5 rounded-full bg-accent text-accent-foreground hover:bg-accent-light transition-colors mb-3"
                    >
                      {locale === "en" ? "Buy on partner site" : locale === "es" ? "Comprar en el sitio del socio" : "Comprar no site parceiro"}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <p className="font-sans text-[11px] text-white/40 text-center mb-3">
                      {locale === "en" ? "You will be redirected to a partner platform." : locale === "es" ? "Será redirigido a una plataforma asociada." : "Você será redirecionado para a plataforma parceira."}
                    </p>
                  </>
                ) : (
                  <Link
                    href={{ pathname: "/checkout/[slug]", params: { slug: course.slug } }}
                    className="block w-full text-center font-sans text-sm font-semibold px-6 py-3.5 rounded-full bg-accent text-accent-foreground hover:bg-accent-light transition-colors mb-3"
                  >
                    {t("checkoutButton")}
                  </Link>
                )}
                <a
                  href="https://wa.me/5531972291029"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center font-sans text-sm font-semibold px-6 py-3.5 rounded-full border border-white/20 text-white/80 hover:border-white/50 hover:text-white transition-all"
                >
                  {locale === "en" ? "Ask on WhatsApp" : locale === "es" ? "Consultar por WhatsApp" : "Tirar dúvidas no WhatsApp"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Aula (YouTube) — apenas para matriculados ── */}
      {course.previewUrl && isEnrolled && (
        <section className="bg-canvas/50 border-b border-white/5 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="font-sans text-xs font-semibold text-accent/70 uppercase tracking-widest text-center mb-4">
              Acesso exclusivo — aluno matriculado
            </p>
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/10" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={course.previewUrl}
                title={lc.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Conteúdo principal ── */}
      <div className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 items-start">
        <div className="space-y-14">

          {/* O que você vai aprender */}
          {content.objectives && (
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-6 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary/60" />
                {t("objectives")}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {content.objectives.map((obj) => (
                  <li key={obj} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="font-sans text-sm text-muted leading-relaxed">{obj}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Ementa */}
          {course.modules.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-6">
                {t("curriculum")}
              </h2>
              <div className="flex flex-col gap-3">
                {course.modules.map((mod, i) => (
                  <details
                    key={mod.id}
                    className="group rounded-xl border border-border bg-surface overflow-hidden"
                    open={i === 0}
                  >
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-sans text-sm font-semibold text-foreground select-none">
                      {mod.title}
                      <ChevronRight className="w-4 h-4 text-muted transition-transform group-open:rotate-90" />
                    </summary>
                    <ul className="px-5 pb-4 flex flex-col gap-2 border-t border-border">
                      {mod.lessons.map((lesson) => (
                        <li
                          key={lesson.id}
                          className="flex items-center gap-3 font-sans text-sm text-muted py-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                          {lesson.title}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Público-alvo */}
          {content.targetAudience && (
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-6">
                {t("targetAudience")}
              </h2>
              <ul className="flex flex-col gap-2">
                {content.targetAudience.map((target) => (
                  <li key={target} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-sans text-sm text-muted">{target}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* O que está incluído */}
          {content.includes && (
            <section>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-6 flex items-center gap-3">
                <Award className="w-5 h-5 text-primary/60" />
                {t("includes")}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {content.includes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-accent-dark mt-0.5 shrink-0" />
                    <span className="font-sans text-sm text-muted leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── Sidebar — Instrutor ── */}
        <div className="lg:sticky lg:top-24 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                {course.instructor.photoUrl ? (
                  <Image
                    src={course.instructor.photoUrl}
                    alt={course.instructor.user.name ?? ""}
                    fill
                    className="object-cover object-top"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full bg-canvas" />
                )}
              </div>
              <div>
                <p className="font-serif text-lg font-medium text-foreground leading-tight">
                  {course.instructor.user.name}
                </p>
                <p className="font-sans text-xs text-muted mt-1 leading-snug">
                  {course.instructor.title}
                  {course.instructor.crm && ` · ${course.instructor.crm}`}
                </p>
              </div>
            </div>
            {content.instructorBio && (
              <p className="font-sans text-sm text-muted leading-relaxed mb-3">
                {content.instructorBio}
              </p>
            )}
            {/* Links sociais do instrutor */}
            {(course.instructor.linkedin || course.instructor.instagram) && (
              <div className="flex items-center gap-3 pt-1 border-t border-border mt-3">
                {course.instructor.linkedin && (
                  <a
                    href={course.instructor.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-sans text-xs text-muted hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    LinkedIn
                  </a>
                )}
                {course.instructor.instagram && (
                  <a
                    href={course.instructor.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-sans text-xs text-muted hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Instagram
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── Co-instrutor (quando preenchido) ── */}
          {course.coInstructorName && (
            <div className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                  {course.coInstructorPhotoUrl ? (
                    <Image
                      src={course.coInstructorPhotoUrl}
                      alt={course.coInstructorName}
                      fill
                      className="object-cover object-top"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full bg-canvas" />
                  )}
                </div>
                <div>
                  <p className="font-serif text-lg font-medium text-foreground leading-tight">
                    {course.coInstructorName}
                  </p>
                  {course.coInstructorCredential && (
                    <p className="font-sans text-xs text-muted mt-1 leading-snug">
                      {course.coInstructorCredential}
                    </p>
                  )}
                </div>
              </div>
              {course.coInstructorBio && (
                <p className="font-sans text-sm text-muted leading-relaxed mb-3">
                  {course.coInstructorBio}
                </p>
              )}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(course as any).coInstructorInstagram && (
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <a
                    href={(course as any).coInstructorInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-sans text-xs text-muted hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Instagram
                  </a>
                </div>
              )}
            </div>
          )}

          {/* CTA mobile */}
          <div className="lg:hidden bg-surface border border-border rounded-2xl p-6">
            <p className="font-serif text-3xl font-semibold text-primary mb-1">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Number(course.price))}
            </p>
            <p className="font-sans text-xs text-muted mb-5">
              {course.hours}{t("hours")}
            </p>
            {course.externalCheckoutUrl ? (
              <a
                href={course.externalCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full text-center font-sans text-sm font-semibold px-6 py-3.5 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                {locale === "en" ? "Buy on partner site" : "Comprar no site parceiro"}
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <Link
                href={{ pathname: "/checkout/[slug]", params: { slug: course.slug } }}
                className="block w-full text-center font-sans text-sm font-semibold px-6 py-3.5 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                {t("checkoutButton")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Selos de qualidade — apenas cursos com certificação FACOP/MEC ── */}
      {course.showCertificationSeals && <section className="relative py-16 px-4 overflow-hidden bg-canvas">
        {/* Grid sutil */}
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(203,228,230,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(203,228,230,0.015) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        {/* Logo marca d'água */}
        <div aria-hidden className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 opacity-[0.035] w-[400px] hidden sm:block">
          <Image src="/icone-nuvem.svg" alt="" width={400} height={285} className="w-full h-auto" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <h2 className="font-serif text-2xl font-light text-white text-center mb-10">
            Qualidade e Reconhecimento
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* MEC */}
            <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-8 transition-all duration-300 hover:bg-white/[0.11] hover:border-accent/30 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <Image
                src="/selo-mec-nuvem.svg"
                alt="Reconhecido pelo MEC"
                width={110}
                height={110}
                className="shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
              />
              <div>
                <p className="font-serif text-xl font-medium text-white mb-2">Reconhecido pelo MEC</p>
                <p className="font-sans text-sm text-white/60 leading-relaxed">
                  Os cursos da NU.V.E.M ENSINO são oferecidos em parceria com a <strong className="text-accent font-semibold">Faculdade FACOP</strong>, reconhecida pelo Ministério da Educação (MEC) para oferta de cursos presenciais e EAD, garantindo qualidade acadêmica e certificação válida em todo o território nacional.
                </p>
              </div>
            </div>
            {/* ISO 9001 */}
            <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-8 transition-all duration-300 hover:bg-white/[0.11] hover:border-accent/30 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <Image
                src="/selo-iso.svg"
                alt="Certificação ISO 9001"
                width={110}
                height={110}
                className="shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
              />
              <div>
                <p className="font-serif text-xl font-medium text-white mb-2">Certificação ISO 9001</p>
                <p className="font-sans text-sm text-white/60 leading-relaxed">
                  Possuímos certificação internacional de qualidade ISO 9001, que atesta a excelência em nossos processos de gestão, metodologias de ensino e entrega de conteúdo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      }

      {/* ── FAQ ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-medium text-foreground text-center mb-10">
            Perguntas Frequentes
          </h2>
          <div className="flex flex-col gap-3">
            {(course.category === "HANDS_ON" || course.category === "HYBRID" ? [
              {
                q: "O material do curso é entregue na hora?",
                a: "Sim! Todo o material didático — apostilas, protocolos e referências bibliográficas — é entregue presencialmente no dia do curso. Você sai com tudo em mãos.",
              },
              {
                q: "O curso é totalmente prático?",
                a: "Sim. Nossos cursos Hands-On são focados na prática clínica, com estações de treinamento supervisionadas por especialistas. A teoria é apresentada de forma objetiva para embasar a prática.",
              },
              {
                q: "Preciso ter experiência prévia para participar?",
                a: "Não é obrigatório. O curso é estruturado para atender desde profissionais iniciantes até experientes. O conteúdo é adaptado ao nível do grupo.",
              },
              {
                q: "Receberei certificado de conclusão?",
                a: "Sim. O certificado é emitido pela Faculdade FACOP, credenciada pelo MEC, com carga horária especificada. Você receberá por e-mail após o curso.",
              },
              {
                q: "Sou aluno Nuvem. Como consigo meu desconto?",
                a: "Alunos com matrícula ativa em outro curso da NU.V.E.M têm desconto especial. Entre em contato pelo WhatsApp para receber seu cupom personalizado.",
              },
              {
                q: "Como funciona o credenciamento no dia do evento?",
                a: "O credenciamento é feito na recepção do local a partir do horário indicado na confirmação de inscrição. Apresente seu documento de identidade e o comprovante de inscrição.",
              },
            ] : [
              {
                q: "Terei acesso permanente às aulas após a exibição de cada módulo?",
                a: "Sim! Após a liberação de cada módulo, você tem acesso permanente a todas as aulas. Assista quantas vezes quiser, no horário que preferir.",
              },
              {
                q: "Os módulos são liberados todos de uma vez ou em datas diferentes?",
                a: "Os módulos seguem um calendário de liberação progressiva (drip content). Cada módulo é disponibilizado na data programada, para que você acompanhe o conteúdo de forma estruturada. Após liberado, permanece acessível para sempre.",
              },
              {
                q: "Posso assistir às aulas em qualquer horário?",
                a: "Sim. Todo o conteúdo é 100% assíncrono e fica disponível 24h por dia. Você estuda no seu ritmo, sem horário fixo.",
              },
              {
                q: "Haverá material de apoio ou apostilas?",
                a: "Sim. Materiais complementares são disponibilizados dentro da plataforma ao longo do curso.",
              },
              {
                q: "Sou aluno Nuvem. Como consigo meu desconto?",
                a: "Alunos com matrícula ativa em outro curso da NU.V.E.M têm desconto especial. Entre em contato pelo WhatsApp para receber seu cupom personalizado.",
              },
              {
                q: "Não consigo acessar minha conta ou redefinir a senha. O que faço?",
                a: "Clique em 'Esqueci minha senha' na tela de login. O e-mail de redefinição pode cair no spam — verifique essa pasta. Se o problema persistir, fale conosco pelo WhatsApp.",
              },
            ]).map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-border bg-surface overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none font-sans text-sm font-semibold text-foreground select-none gap-4">
                  <span>{q}</span>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="px-6 pb-5 pt-1 font-sans text-sm text-muted leading-relaxed border-t border-border">
                  {a}
                </p>
              </details>
            ))}
          </div>
          <p className="text-center mt-8 font-sans text-sm text-muted">
            Ainda tem dúvidas?{" "}
            <a
              href="https://wa.me/5531972291029"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              Fale conosco no WhatsApp
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
