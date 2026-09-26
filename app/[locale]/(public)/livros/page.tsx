import type { Metadata } from "next";
import { BookOpen, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "books.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "en" ? "/en/books" : locale === "es" ? "/es/libros" : "/livros",
      languages: {
        pt: "/livros",
        en: "/en/books",
        es: "/es/libros",
        "x-default": "/livros",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: locale === "en" ? "/en/books" : locale === "es" ? "/es/libros" : "/livros",
      locale: locale === "en" ? "en_US" : locale === "es" ? "es_ES" : "pt_BR",
    },
  };
}

// Títulos, autoria e links reais da Editora Rubio (não traduzidos, são
// proprios/proper nouns). Os 3 últimos ainda não têm o link direto do
// produto confirmado, por isso apontam para a busca pela autora na Rubio.
const RUBIO_SEARCH_URL = "https://www.rubio.com.br/busca?q=Andrade%2C+Vera+L%C3%BAcia+%C3%82ngelo";

const books: { title: string; authors?: string; href: string; solo: boolean }[] = [
  {
    title: "Testes Respiratórios em Gastrenterologia: Hidrogênio, Metano e Helicobacter Pylori",
    href: "https://rubio.com.br/livro/a62312/9786588340974/testes-respiratorios-em-gastrenterologia-hidrogenio-metano-e-helicobacter-pylori.html",
    solo: true,
  },
  {
    title: "Perguntas e Respostas Comentadas de Gastrenterologia Clínica e Hepatologia",
    href: "https://rubio.com.br/livro/a62313/9786588340998/perguntas-e-respostas-comentadas-de-gastrenterologia-clinica-e-hepatologia.html",
    solo: true,
  },
  {
    title: "Gastrenterologia no Dia a Dia",
    href: RUBIO_SEARCH_URL,
    solo: true,
  },
  {
    title: "Métodos Diagnósticos em Doenças Funcionais e Motilidade Digestiva do Núcleo de Fisiologia Gastrintes",
    authors: "Com Paulo José Pereira de Campos Carvalho e Nayara Salgado Carvalho",
    href: "https://rubio.com.br/livro/c58906/9786588340844/metodos-diagnosticos-em-doencas-funcionais-e-motilidade-digestiva-do-nucleo-de-fisiologia-gastrintes.html",
    solo: false,
  },
  {
    title: "Doenças Funcionais na Gastrenterologia",
    authors: "Organizadora",
    href: "https://rubio.com.br/livro/a61637/9786588340783/doencas-funcionais-na-gastrenterologia.html",
    solo: false,
  },
  {
    title: "Manual de Terapêutica em Gastrenterologia e Hepatologia Pediátrica",
    authors: "Com Ana Daniela Izoton de Sadovsky",
    href: RUBIO_SEARCH_URL,
    solo: false,
  },
  {
    title: "Manual de Terapêutica em Gastroenterologia e Hepatologia",
    authors: "Organizadora",
    href: RUBIO_SEARCH_URL,
    solo: false,
  },
  {
    title: "Casos Comentados de Gastrenterologia e Hepatologia",
    authors: "Organizadora",
    href: "https://rubio.com.br/livro/a57235/9786588340028/casos-comentados-de-gastrenterologia-e-hepatologia.html",
    solo: false,
  },
];

function BookCard({ book, buyLabel }: { book: (typeof books)[number]; buyLabel: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <BookOpen className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="font-serif text-lg font-medium text-foreground leading-snug">{book.title}</h3>
        {book.authors && (
          <p className="font-sans text-xs text-muted mt-1">{book.authors}</p>
        )}
      </div>
      <a
        href={book.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 font-sans text-sm font-semibold px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary-dark transition-colors"
      >
        {buyLabel}
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

export default async function LivrosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "books" });

  const soloBooks = books.filter((b) => b.solo);
  const coBooks = books.filter((b) => !b.solo);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-canvas px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent opacity-80 mb-4 block">
            {t("hero.badge")}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-white mb-6 leading-tight">
            {t("hero.title")}
          </h1>
          <p className="font-sans text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
            {t("hero.description")}
          </p>
        </div>
      </section>

      {/* Autoria individual */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl font-medium text-foreground mb-8">
          {t("soloLabel")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {soloBooks.map((book) => (
            <BookCard key={book.href + book.title} book={book} buyLabel={t("buyButton")} />
          ))}
        </div>
      </section>

      {/* Organizados e em coautoria */}
      <section className="bg-surface border-y border-border px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-2xl font-medium text-foreground mb-8">
            {t("coLabel")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coBooks.map((book) => (
              <BookCard key={book.href + book.title} book={book} buyLabel={t("buyButton")} />
            ))}
          </div>
        </div>
      </section>

      {/* Aviso sobre preço/compra */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <p className="font-sans text-xs text-muted/70 text-center leading-relaxed">
          {t("disclaimer")}
        </p>
      </section>

      {/* CTA cursos */}
      <section className="relative py-24 px-4 overflow-hidden"
        style={{
          backgroundColor: "#FFFFFF",
          backgroundImage: `linear-gradient(rgba(0,71,94,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,71,94,0.06) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}>
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="relative p-[1px] rounded-3xl"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(0,71,94,0.15) 50%, rgba(255,255,255,0.9) 100%)" }}>
            <div className="relative rounded-3xl py-16 px-8 sm:px-12"
              style={{
                background: "rgba(255,255,255,0.35)",
                backdropFilter: "blur(20px) saturate(160%)",
                WebkitBackdropFilter: "blur(20px) saturate(160%)",
                boxShadow: "0 8px 32px rgba(0,71,94,0.10), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-primary mb-4">
                {t("cta.title")}
              </h2>
              <p className="font-sans text-base sm:text-lg text-primary/60 mb-10 leading-relaxed max-w-md mx-auto">
                {t("cta.description")}
              </p>
              <Link href="/cursos"
                className="group relative inline-flex items-center gap-2 font-sans text-sm font-semibold px-10 py-4 rounded-full bg-primary text-white transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,71,94,0.4)] hover:scale-[1.03]">
                <span>{t("cta.button")}</span>
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 transition-transform group-hover:translate-x-1">
                  <path fillRule="evenodd" d="M2 8a.5.5 0 01.5-.5h9.293L9.146 4.854a.5.5 0 11.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L11.793 8.5H2.5A.5.5 0 012 8z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
