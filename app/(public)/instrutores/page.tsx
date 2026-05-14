import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" strokeWidth={0} />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Instrutores | Nuvem Ensino",
  description:
    "Conheça o corpo docente da Nuvem Ensino — especialistas referência nacional em gastroenterologia, motilidade digestiva e fisioterapia pélvica.",
};

const profiles: Record<
  string,
  {
    especialidade: string;
    crm?: string;
    foto: string;
    instagram?: string;
    formacao: string[];
    bio: string;
  }
> = {
  "dr-felipe-nelson": {
    especialidade: "Gastroenterologia · Motilidade Digestiva",
    crm: "CRM-MG",
    foto: "/instructors/felipe-nelson.jpg",
    instagram: "https://www.instagram.com/felipenelson.gastro/",
    bio: "Gastroenterologista com ampla experiência em doenças motoras do esôfago, realizando manometria esofágica de alta resolução e pHmetria. Atua nas doenças relacionadas ao esôfago e estômago — refluxo gastroesofágico, gastrites, acalásia e espasmo esofagiano — além de ter experiência em Hepatologia e Doenças Inflamatórias Intestinais. Realiza consultas e exames na Clínica Nuvem Medicina em Belo Horizonte.",
    formacao: [
      "Gastroenterologista pela Universidade de São Paulo (USP) — Ribeirão Preto",
      "Doutorado pela Universidade de São Paulo (USP)",
      "Sócio Titular da Federação Brasileira de Gastroenterologia (FBG)",
    ],
  },
  "dra-vera-angelo": {
    especialidade: "Gastroenterologia · Motilidade Digestiva",
    crm: "CRM-MG 22284 · RQE 10411 (Gastroenterologia) · RQE 22736 (Patologia Clínica)",
    foto: "/instructors/dra-vera.jpg",
    instagram: "https://www.instagram.com/veraangelo/",
    bio: "Responsável Técnica da Clínica NU.V.E.M MEDICINA e ENSINO. Professora Convidada da pós-graduação em Doenças Funcionais e Manometria pelo Hospital Israelita Albert Einstein. Tutora de treinamentos em doenças funcionais e testes respiratórios. Autora de publicações de referência na área de gastroenterologia e motilidade digestiva.",
    formacao: [
      "Mestre e Doutora em Patologia pela UFMG",
      "Gastroenterologista com Título de Especialista pela FBG",
      "Residência em Gastroenterologia — Hospital Felício Rocho",
      "Residência em Clínica Médica / Patologia Clínica — Hospital Sarah Kubitschek",
      "Sócia Titular da GEDIIB e da Sociedade Brasileira de Motilidade Digestiva",
      "Autora: Doenças Funcionais em Gastrenterologia 2025 · Métodos Diagnósticos 2025 · Manual Prático do Teste Respiratório 2019 (Editora Rubio)",
    ],
  },
  "dra-anna-karoline": {
    especialidade: "Fisioterapia Pélvica",
    foto: "/instructors/anna-karoline.jpg",
    instagram: "https://www.instagram.com/karolrocha.fisio/",
    bio: "Fisioterapeuta especialista em disfunções do assoalho pélvico, com atuação clínica em avaliação e reabilitação pélvica. Doutoranda pela UNICAMP, alia rigor científico e experiência clínica para oferecer formação de alto nível a profissionais de saúde.",
    formacao: [
      "Graduação em Fisioterapia pela PUC-MG",
      "Mestrado em Ciências da Reabilitação pela UNIFAL-MG",
      "Doutoranda pela UNICAMP",
      "Especialista em Disfunções do Assoalho Pélvico",
    ],
  },
  "dra-eliane-basques": {
    especialidade: "Gastroenterologia · Manometria Anorretal",
    crm: "CRM-MG 27601 · RQE 9324",
    foto: "/instructors/dra-eliane.jpg",
    instagram: "https://www.instagram.com/elianebasques/",
    bio: "Cirurgiã Pediatra da Fundação Hospitalar do Estado de Minas Gerais (FHEMIG) e sócia proprietária da Clínica Nuvem Medicina em Belo Horizonte. Especialista em manometria anorretal de alta resolução e distúrbios funcionais do assoalho pélvico.",
    formacao: [
      "Graduação em Medicina pela UFMG (1994)",
      "Residência em Cirurgia Geral e Pediátrica",
      "Mestre em Saúde da Criança e do Adolescente",
      "Pós-graduação em Doenças Funcionais — Instituto Israelita Albert Einstein",
    ],
  },
};

export default async function InstrutoresPage() {
  const instructors = await prisma.instructor.findMany({
    include: {
      user: { select: { name: true } },
      courses: {
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, slug: true },
      },
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
        <div className="flex flex-col gap-6">
          {instructors.map((inst) => {
            const p = profiles[inst.slug];
            if (!p) return null;

            return (
              <div key={inst.id} className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Foto */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0">
                    <Image
                      src={p.foto}
                      alt={inst.user.name ?? ""}
                      fill
                      className="object-cover object-top"
                      sizes="128px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
                      <div>
                        <h2 className="font-serif text-xl font-medium text-foreground">
                          {inst.user.name}
                        </h2>
                        <p className="font-sans text-xs text-primary font-semibold mt-0.5">
                          {p.especialidade}
                        </p>
                        {p.crm && (
                          <p className="font-sans text-[10px] text-muted mt-0.5">{p.crm}</p>
                        )}
                      </div>
                      {p.instagram && (
                        <a
                          href={p.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Instagram"
                          className="flex items-center gap-1.5 font-sans text-xs text-muted hover:text-primary transition-colors"
                        >
                          <InstagramIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            @{p.instagram.split("instagram.com/")[1].replace("/", "")}
                          </span>
                        </a>
                      )}
                    </div>

                    <p className="font-sans text-sm text-muted leading-relaxed mt-3">
                      {p.bio}
                    </p>

                    {/* Formação */}
                    <ul className="mt-3 space-y-1">
                      {p.formacao.map((item) => (
                        <li key={item} className="flex items-start gap-2 font-sans text-xs text-muted">
                          <span className="text-primary mt-0.5 shrink-0">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>

                    {/* Cursos */}
                    {inst.courses.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {inst.courses.map((c) => (
                          <Link
                            key={c.id}
                            href={`/cursos/${c.slug}`}
                            className="font-sans text-[11px] font-semibold px-3 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors"
                          >
                            {c.title.length > 40 ? c.title.slice(0, 40) + "…" : c.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
