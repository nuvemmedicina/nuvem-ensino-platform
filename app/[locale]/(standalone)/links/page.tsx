import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "NU.V.E.M ENSINO | Links",
  description: "Cursos, livros e contato da NU.V.E.M ENSINO.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/links" },
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const buttonClass =
  "flex items-center justify-between gap-3 bg-white border border-[#E4E1D6] rounded-xl px-6 py-4 text-[#0E2B33] hover:border-[#0E2B33]/30 hover:shadow-sm transition-all";

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass}>
      <span className="font-sans text-[15px] font-medium">{label}</span>
      <span className="text-[#8A8577]"><ArrowIcon /></span>
    </a>
  );
}

function InternalLinkButton({ href, label }: { href: "/livros" | "/sobre" | "/instrutores"; label: string }) {
  return (
    <Link href={href} className={buttonClass}>
      <span className="font-sans text-[15px] font-medium">{label}</span>
      <span className="text-[#8A8577]"><ArrowIcon /></span>
    </Link>
  );
}

function CourseLinkButton({ slug, label }: { slug: string; label: string }) {
  return (
    <Link href={{ pathname: "/cursos/[slug]", params: { slug } }} className={buttonClass}>
      <span className="font-sans text-[15px] font-medium">{label}</span>
      <span className="text-[#8A8577]"><ArrowIcon /></span>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#C9A84C] text-center mt-8 mb-3">
      {children}
    </p>
  );
}

export default async function LinksPage() {
  const dbCourses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    select: { title: true, slug: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  const cursosPresenciais = dbCourses
    .filter((c) => c.category === "HANDS_ON" || c.category === "HYBRID")
    .slice(0, 4);

  const cursosOnline = dbCourses
    .filter((c) => c.category === "ONLINE")
    .slice(0, 4);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#F1F5F5",
        backgroundImage:
          "linear-gradient(rgba(14,43,51,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14,43,51,0.05) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <div className="max-w-lg mx-auto px-6 py-14 flex flex-col items-center">
        <Image src="/icone-nuvem.png" alt="" width={56} height={56} className="w-12 h-12 object-contain mb-4" />
        <h1 className="font-serif text-2xl text-[#0E2B33] tracking-wide">NU.V.E.M ENSINO</h1>
        <p className="font-sans text-sm text-[#5B6B6E] text-center mt-2 max-w-sm">
          Plataforma de formação médica com excelência em ensino clínico para profissionais de saúde
        </p>

        <Link
          href="/cursos"
          className="w-full mt-8 flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-white font-sans text-[15px] font-semibold"
          style={{ background: "linear-gradient(135deg, #0E2B33 0%, #1A4A52 100%)" }}
        >
          Ver cursos
        </Link>

        {cursosPresenciais.length > 0 && (
          <>
            <SectionLabel>Cursos hands-on</SectionLabel>
            <div className="w-full flex flex-col gap-3">
              {cursosPresenciais.map((c) => (
                <CourseLinkButton key={c.slug} slug={c.slug} label={c.title} />
              ))}
            </div>
          </>
        )}

        {cursosOnline.length > 0 && (
          <>
            <SectionLabel>Cursos online</SectionLabel>
            <div className="w-full flex flex-col gap-3">
              {cursosOnline.map((c) => (
                <CourseLinkButton key={c.slug} slug={c.slug} label={c.title} />
              ))}
            </div>
          </>
        )}

        <SectionLabel>Livros</SectionLabel>
        <div className="w-full flex flex-col gap-3">
          <InternalLinkButton href="/livros" label="Livros da Dra. Vera Ângelo" />
        </div>

        <SectionLabel>Sobre</SectionLabel>
        <div className="w-full flex flex-col gap-3">
          <InternalLinkButton href="/sobre" label="Conheça a NU.V.E.M ENSINO" />
          <InternalLinkButton href="/instrutores" label="Corpo docente" />
        </div>

        <SectionLabel>Fale com a gente</SectionLabel>
        <div className="w-full flex flex-col gap-3">
          <LinkButton href="https://wa.me/5531972291029" label="WhatsApp" />
          <LinkButton href="mailto:cursos@nuvemensino.com.br" label="E-mail" />
          <LinkButton href="https://instagram.com/nuvemensino" label="Instagram" />
        </div>

        <div className="mt-12 flex flex-col items-center gap-2 text-center">
          <p className="font-sans text-xs text-[#8A8577]">Belo Horizonte, MG</p>
          <Link href="/privacidade" className="font-sans text-xs text-[#8A8577] underline">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </div>
  );
}
