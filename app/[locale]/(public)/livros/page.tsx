import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, ExternalLink } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BuyBookLink } from "@/components/BuyBookLink";

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

// Linha de papel embaixo do título: "organizer" vira Organizadora/Editor e
// "coauthors" vira "com Fulano e Beltrano", ambos traduzidos por idioma (os
// nomes ficam como estão). "coverTitle" encurta o título no texto alternativo
// da capa quando o título completo tem subtítulo.
type Book = {
  title: string;
  coverTitle?: string;
  organizer?: boolean;
  coauthors?: string[];
  href: string;
  solo: boolean;
  cover?: string;
};

// Ordem: do mais recente para o mais antigo dentro de cada seção.
const books: Book[] = [
  {
    title: "Testes Respiratórios em Gastrenterologia: Hidrogênio, Metano e Helicobacter Pylori",
    href: "https://rubio.com.br/livro/a62312/9786588340974/testes-respiratorios-em-gastrenterologia-hidrogenio-metano-e-helicobacter-pylori.html",
    cover: "/books/testes-respiratorios-h2-ch4-hp.jpg",
    solo: true,
  },
  {
    title: "Perguntas e Respostas Comentadas de Gastrenterologia Clínica e Hepatologia",
    href: "https://rubio.com.br/livro/a62313/9786588340998/perguntas-e-respostas-comentadas-de-gastrenterologia-clinica-e-hepatologia.html",
    cover: "/books/perguntas-e-respostas-comentadas.jpg",
    solo: true,
  },
  {
    title: "Gastrenterologia no Dia a Dia",
    href: "https://www.rubio.com.br/livro/a60505/9786588340615/gastrenterologia-no-dia-a-dia.html",
    cover: "/books/gastrenterologia-no-dia-a-dia.jpg",
    solo: true,
  },
  {
    title: "Intolerâncias & Alergias Alimentares: da fisiopatologia à prática clínica",
    coverTitle: "Intolerâncias & Alergias Alimentares",
    organizer: true,
    coauthors: ["Ilanna Marques"],
    href: "https://editorarubio.com.br/intolerancias",
    cover: "/books/intolerancias-alergias-alimentares.jpg",
    solo: false,
  },
  {
    title: "Métodos Diagnósticos em Doenças Funcionais e Motilidade Digestiva do Núcleo de Fisiologia Gastrintes",
    coauthors: ["Paulo José Pereira de Campos Carvalho", "Nayara Salgado Carvalho"],
    href: "https://rubio.com.br/livro/c58906/9786588340844/metodos-diagnosticos-em-doencas-funcionais-e-motilidade-digestiva-do-nucleo-de-fisiologia-gastrintes.html",
    cover: "/books/metodos-diagnosticos-doencas-funcionais.jpg",
    solo: false,
  },
  {
    title: "Doenças Funcionais na Gastrenterologia",
    organizer: true,
    href: "https://rubio.com.br/livro/a61637/9786588340783/doencas-funcionais-na-gastrenterologia.html",
    cover: "/books/doencas-funcionais-na-gastrenterologia.jpg",
    solo: false,
  },
  {
    title: "Manual de Terapêutica em Gastrenterologia e Hepatologia Pediátrica",
    coauthors: ["Ana Daniela Izoton de Sadovsky"],
    href: "https://www.rubio.com.br/livro/s31420/9786588340318/manual-de-terapeutica-em-gastrenterologia-e-hepatologia-pediatrica.html",
    cover: "/books/manual-terapeutica-pediatrica.jpg",
    solo: false,
  },
  {
    title: "Manual de Terapêutica em Gastroenterologia e Hepatologia",
    organizer: true,
    href: "https://www.rubio.com.br/livro/a57877/9786588340240/manual-de-terapeutica-em-gastroenterologia-e-hepatologia.html",
    cover: "/books/manual-terapeutica-gastroenterologia-hepatologia.jpg",
    solo: false,
  },
  {
    title: "Casos Comentados de Gastrenterologia e Hepatologia",
    organizer: true,
    href: "https://rubio.com.br/livro/a57235/9786588340028/casos-comentados-de-gastrenterologia-e-hepatologia.html",
    cover: "/books/casos-comentados-gastroenterologia-hepatologia.jpg",
    solo: false,
  },
];

// Faixa de lançamento no topo da página. Sai do ar sozinha no fim de 01/12/2026
// (horário de Brasília): a página é refeita a cada hora (revalidate), então
// some na primeira atualização depois desse horário. Sem preço, desconto nem
// prazo na faixa: as condições da pré-venda ficam na página da Rubio.
const LAUNCH = {
  href: "https://editorarubio.com.br/intolerancias",
  until: new Date("2026-12-02T00:00:00-03:00"),
};

// Fora do componente porque lê o relógio: o livro em lançamento, ou nada
// depois do prazo.
function currentLaunchBook(): Book | undefined {
  if (Date.now() >= LAUNCH.until.getTime()) return undefined;
  return books.find((b) => b.href === LAUNCH.href);
}

type BookLabels = {
  buy: string;
  role: (book: Book) => string | null;
  coverAlt: (book: Book) => string;
};

function BookCard({ book, labels }: { book: Book; labels: BookLabels }) {
  const role = labels.role(book);
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col">
      <div className="relative w-full bg-primary/5" style={{ aspectRatio: "3/4" }}>
        {book.cover ? (
          <Image
            src={book.cover}
            alt={labels.coverAlt(book)}
            fill
            className="object-contain"
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-primary/30" />
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col gap-4 flex-1">
        <div className="flex-1">
          <h3 className="font-serif text-lg font-medium text-foreground leading-snug">{book.title}</h3>
          {role && (
            <p className="font-sans text-xs text-muted mt-1">{role}</p>
          )}
        </div>
        <BuyBookLink
          href={book.href}
          title={book.title}
          className="inline-flex items-center justify-center gap-2 font-sans text-sm font-semibold px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary-dark transition-colors"
        >
          {labels.buy}
          <ExternalLink className="w-4 h-4" />
        </BuyBookLink>
      </div>
    </div>
  );
}

function LaunchBanner({
  book,
  labels,
  t,
}: {
  book: Book;
  labels: BookLabels;
  t: (key: "badge" | "byline" | "button") => string;
}) {
  return (
    <section className="max-w-5xl mx-auto px-4 pt-12">
      <div className="bg-accent/40 border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        {book.cover && (
          <div className="relative w-32 sm:w-36 shrink-0 rounded-lg overflow-hidden shadow-md" style={{ aspectRatio: "1403/2000" }}>
            <Image
              src={book.cover}
              alt={labels.coverAlt(book)}
              fill
              className="object-cover"
              sizes="144px"
              priority
            />
          </div>
        )}
        <div className="flex-1 text-center sm:text-left">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-primary/70 mb-2 block">
            {t("badge")}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground leading-snug">
            {book.title}
          </h2>
          <p className="font-sans text-sm text-muted mt-2">{t("byline")}</p>
          <BuyBookLink
            href={book.href}
            title={book.title}
            className="mt-5 inline-flex items-center justify-center gap-2 font-sans text-sm font-semibold px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary-dark transition-colors"
          >
            {t("button")}
            <ExternalLink className="w-4 h-4" />
          </BuyBookLink>
        </div>
      </div>
    </section>
  );
}

// O rodapé lista os cursos publicados; a página é refeita no máximo uma vez por hora.
export const revalidate = 3600;

export default async function LivrosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "books" });

  // "A e B" / "A and B" / "A y B", conforme o idioma.
  const listFormat = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
  const labels: BookLabels = {
    buy: t("buyButton"),
    role: (book) => {
      const names = book.coauthors?.length ? listFormat.format(book.coauthors) : null;
      if (book.organizer && names) return t("roles.organizerWith", { names });
      if (book.organizer) return t("roles.organizer");
      if (names) return t("roles.with", { names });
      return null;
    },
    coverAlt: (book) => t("coverAlt", { title: book.coverTitle ?? book.title }),
  };

  const launchBook = currentLaunchBook();
  const tLaunch = await getTranslations({ locale, namespace: "books.launch" });

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

      {launchBook && <LaunchBanner book={launchBook} labels={labels} t={tLaunch} />}

      {/* Autoria individual */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl font-medium text-foreground mb-8">
          {t("soloLabel")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {soloBooks.map((book) => (
            <BookCard key={book.href + book.title} book={book} labels={labels} />
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
              <BookCard key={book.href + book.title} book={book} labels={labels} />
            ))}
          </div>
        </div>
      </section>

      {/* Aviso sobre preço/compra */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <p className="font-sans text-xs text-muted/70 text-center leading-relaxed">
          {t("disclaimer")}
        </p>
        <p className="text-center mt-4">
          <a
            href={RUBIO_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-primary font-semibold hover:underline"
          >
            {t("seeAllLink")}
          </a>
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
