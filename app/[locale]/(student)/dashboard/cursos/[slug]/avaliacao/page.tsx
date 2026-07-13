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

      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium text-foreground mb-1">Avaliação do curso</h1>
        <p className="font-sans text-sm text-muted">
          Sua opinião é muito importante para continuar aprimorando a qualidade do conteúdo.
        </p>
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
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 sm:items-start items-center text-center sm:text-left">
            {/* Foto */}
            <div className="shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/instructors/dra-vera-angelo-1.jpeg"
                  alt="Dra. Vera Ângelo"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-lg font-medium text-foreground">Dra. Vera Ângelo</h2>
              <p className="font-sans text-xs text-primary font-semibold mb-3">Diretora Científica · NU.V.E.M Ensino</p>
              <p className="font-sans text-sm text-muted leading-relaxed">
                Médica gastroenterologista com mais de 30 anos de dedicação à saúde digestiva e à formação acadêmica.
                Especialista em Neurogastroenterologia e Manometria Digestiva pelo Hospital Israelita Albert Einstein,
                possui Mestrado e Doutorado em Patologia pela UFMG. Sua trajetória é marcada pela vanguarda no estudo
                da Motilidade Digestiva, Microbiota Intestinal e Testes Respiratórios. Autora de livros e publicações
                científicas de relevância, é palestrante frequente em congressos nacionais e internacionais.
                Atualmente, lidera a disseminação de conhecimento especializado como Diretora Científica da NU.V.E.M Ensino.
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

          {/* YouTube Nuvem Medicina */}
          <a
            href="https://www.youtube.com/@NuvemMedicina"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-full border border-border hover:border-[#ff0000]/40 hover:bg-[#ff0000]/5 transition-colors text-foreground"
          >
            <svg className="w-4 h-4 text-[#ff0000]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            @NuvemMedicina
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/company/nuvem-medicina/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-full border border-border hover:border-[#0a66c2]/40 hover:bg-[#0a66c2]/5 transition-colors text-foreground"
          >
            <svg className="w-4 h-4 text-[#0a66c2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Nuvem Medicina
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

      {/* ── Selos ── */}
      <div className="mt-8 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/selos-mec-iso.svg"
          alt="ISO 9001 · Reconhecido pelo MEC"
          className="h-24 opacity-80"
        />
      </div>
    </div>
  );
}
