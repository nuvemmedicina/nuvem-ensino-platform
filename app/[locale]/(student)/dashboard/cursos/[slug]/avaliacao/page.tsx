import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EvaluationForm } from "./EvaluationForm";
import { submitEvaluation } from "./actions";

type Props = { params: Promise<{ slug: string; locale: string }> };

export default async function AvaliacaoPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard");

  const course = await prisma.course.findFirst({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    select: { status: true },
  });
  if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
    redirect(`/cursos/${slug}`);
  }

  let existing = null;
  try {
    existing = await prisma.courseEvaluation.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    });
  } catch {
    // tabela ainda não existe (migration pendente) — ignora
  }

  const action = submitEvaluation.bind(null, course.id, slug);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Topbar */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/dashboard/cursos/${slug}`}
          className="flex items-center gap-1.5 font-sans text-sm text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao curso
        </Link>
        <span className="text-border">/</span>
        <span className="font-sans text-sm text-foreground font-medium">{course.title}</span>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground mb-1">Avaliação do curso</h1>
          <p className="font-sans text-sm text-muted">
            Sua opinião é muito importante para continuar aprimorando a qualidade do conteúdo.
          </p>
        </div>
        {/* Selos ISO 9001 + MEC */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/selos-mec-iso.svg"
          alt="ISO 9001 · Reconhecido pelo MEC"
          className="h-20 shrink-0 opacity-90"
        />
      </div>

      {/* Formulário */}
      <EvaluationForm action={action} existing={existing} courseSlug={slug} />

      {/* ── Seção Dra. Vera Ângelo ── */}
      <div className="mt-12 rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 px-6 py-5 border-b border-border">
          <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
            Direção Científica
          </p>
          <p className="font-sans text-xs text-muted">Conheça a responsável pelo conteúdo do curso</p>
        </div>

        <div className="p-6">
          <div className="flex gap-5 items-start">
            {/* Foto */}
            <div className="shrink-0">
              <div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/20 overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://www.nuvemmedicina.com.br/wp-content/uploads/2023/03/dra-vera-angelo.jpg"
                  alt="Dra. Vera Ângelo"
                  className="w-full h-full object-cover"
                  onError={undefined}
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-lg font-medium text-foreground">Dra. Vera Ângelo</h2>
              <p className="font-sans text-xs text-primary font-semibold mb-2">Diretora Científica · Nuvem Medicina</p>
              <p className="font-sans text-sm text-muted leading-relaxed">
                Médica gastroenterologista com vasta experiência em distúrbios da interação cérebro-intestino (DICI).
                Coordena o conteúdo científico da plataforma Nuvem Ensino, garantindo excelência e atualização contínua
                do material didático.
              </p>

              {/* Links */}
              <div className="flex flex-wrap gap-2 mt-4">
                <a
                  href="https://www.nuvemmedicina.com.br/dra-vera-angelo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  Perfil completo
                </a>
                <a
                  href="https://www.instagram.com/veraangelo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-full bg-[#e1306c]/10 text-[#e1306c] hover:bg-[#e1306c]/20 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @veraangelo
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Redes sociais & Google Review ── */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-4">
          Siga e avalie a Nuvem
        </p>
        <div className="flex flex-wrap gap-3">
          {/* Instagram Nuvem Ensino */}
          <a
            href="https://www.instagram.com/nuvemensino/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-full border border-border hover:border-[#e1306c]/40 hover:bg-[#e1306c]/5 transition-colors text-foreground"
          >
            <svg className="w-4 h-4 text-[#e1306c]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @nuvemensino
          </a>

          {/* Instagram Nuvem Medicina */}
          <a
            href="https://www.instagram.com/nuvemmedicina/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-full border border-border hover:border-[#e1306c]/40 hover:bg-[#e1306c]/5 transition-colors text-foreground"
          >
            <svg className="w-4 h-4 text-[#e1306c]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @nuvemmedicina
          </a>

          {/* YouTube */}
          <a
            href="https://www.youtube.com/@nuvemensino"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-full border border-border hover:border-[#ff0000]/40 hover:bg-[#ff0000]/5 transition-colors text-foreground"
          >
            <svg className="w-4 h-4 text-[#ff0000]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            @nuvemensino
          </a>

          {/* Google Review */}
          <a
            href="https://g.page/r/CQQmzgdp8IZoEAE/review"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-full border border-border hover:border-amber-400/40 hover:bg-amber-400/5 transition-colors text-foreground"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Avaliar no Google
          </a>
        </div>
      </div>
    </div>
  );
}
