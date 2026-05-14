import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Instrutores | Nuvem Ensino",
  description: "Conheça o corpo docente da Nuvem Ensino — especialistas referência nacional em gastroenterologia, motilidade digestiva e fisioterapia pélvica.",
};

const bios: Record<string, { especialidade: string; bio: string; foto: string; crm?: string }> = {
  "dra-vera": {
    especialidade: "Gastroenterologia · Motilidade Digestiva",
    crm: "CRM-MG 22284 · RQE 10411 · RQE 22736",
    bio: "Diretora da Nuvem Medicina e referência em exames de motilidade digestiva no Brasil. Pioneira na realização de testes respiratórios com novos protocolos e na formação de profissionais de saúde na área.",
    foto: "/instructors/dra-vera.jpg",
  },
  "anna-karoline": {
    especialidade: "Fisioterapia Pélvica",
    bio: "Fisioterapeuta especialista em disfunções do assoalho pélvico, com atuação clínica em avaliação e reabilitação pélvica.",
    foto: "/instructors/anna-karoline.jpg",
  },
  "dra-eliane": {
    especialidade: "Gastroenterologia · Manometria Anorretal",
    bio: "Especialista em manometria anorretal de alta resolução e distúrbios funcionais do assoalho pélvico.",
    foto: "/instructors/dra-eliane.jpg",
  },
  "felipe-nelson": {
    especialidade: "Gastroenterologia · Manometria · pHmetria",
    bio: "Referência em exames de motilidade esofágica, pHmetria de 24 horas e impedancio-pHmetria. Mais de 10 anos de experiência clínica.",
    foto: "/instructors/felipe-nelson.jpg",
  },
};

export default async function InstrutoresPage() {
  const instructors = await prisma.instructor.findMany({
    include: {
      user: { select: { name: true } },
      courses: { where: { status: "PUBLISHED" }, select: { id: true, title: true, slug: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div className="min-h-screen">
      <section className="bg-canvas px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent opacity-80 mb-4 block">
            Corpo docente
          </span>
          <h1 className="font-serif text-4xl font-light text-white">Instrutores</h1>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {instructors.map((inst) => {
            const info = bios[inst.slug] ?? {
              especialidade: "",
              bio: "",
              foto: "/instructors/dra-vera.jpg",
            };

            return (
              <div key={inst.id} className="bg-surface border border-border rounded-2xl p-6 flex gap-5">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                  <Image
                    src={info.foto}
                    alt={inst.user.name ?? ""}
                    fill
                    className="object-cover object-top"
                    sizes="96px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-lg font-medium text-foreground">{inst.user.name}</h2>
                  <p className="font-sans text-xs text-primary font-semibold mt-0.5">{info.especialidade}</p>
                  {info.crm && (
                    <p className="font-sans text-[10px] text-muted mt-0.5 mb-2">{info.crm}</p>
                  )}
                  <p className="font-sans text-xs text-muted leading-relaxed mt-2">{info.bio}</p>

                  {inst.courses.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {inst.courses.map((c) => (
                        <Link
                          key={c.id}
                          href={`/cursos/${c.slug}`}
                          className="font-sans text-[10px] font-semibold px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors"
                        >
                          {c.title.length > 30 ? c.title.slice(0, 30) + "…" : c.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
