"use client";

import { useEffect, useState } from "react";

/**
 * Aula em vídeo que a página pública do curso mostra só a alunos matriculados.
 *
 * Fica fora do HTML da página para que ela possa ser guardada em cache: o
 * endereço do vídeo só chega ao navegador depois que /api/courses/[slug]/aula
 * confirma a matrícula de quem está logado.
 */
export default function AulaMatriculados({ slug, titulo }: { slug: string; titulo: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    fetch(`/api/courses/${encodeURIComponent(slug)}/aula`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((dados: { url?: string } | null) => {
        if (ativo && dados?.url) setUrl(dados.url);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [slug]);

  if (!url) return null;

  return (
    <section className="bg-canvas/50 border-b border-white/5 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="font-sans text-xs font-semibold text-accent/70 uppercase tracking-widest text-center mb-4">
          Acesso exclusivo — aluno matriculado
        </p>
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10" style={{ paddingTop: "56.25%" }}>
          <iframe
            src={url}
            title={titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
    </section>
  );
}
