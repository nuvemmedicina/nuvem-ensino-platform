import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BuyBookLink } from "@/components/BuyBookLink";

// Faixa de lançamento de livro, usada na página inicial e em /livros. Sai do
// ar sozinha no fim de 01/12/2026 (horário de Brasília): as duas páginas são
// refeitas a cada hora (revalidate), então some na primeira atualização depois
// desse horário. Sem preço, desconto nem prazo na faixa: as condições da
// pré-venda ficam na página da Rubio. Os textos ficam em messages/*.json, em
// books.launch e books.coverAlt.
const LAUNCH_BOOK = {
  title: "Intolerâncias & Alergias Alimentares: da fisiopatologia à prática clínica",
  coverTitle: "Intolerâncias & Alergias Alimentares",
  href: "https://editorarubio.com.br/intolerancias",
  cover: "/books/intolerancias-alergias-alimentares.jpg",
  until: new Date("2026-12-02T00:00:00-03:00"),
};

// Fora do componente porque lê o relógio.
function launchIsActive(): boolean {
  return Date.now() < LAUNCH_BOOK.until.getTime();
}

export async function LaunchBanner({
  locale,
  className = "",
}: {
  locale: string;
  className?: string;
}) {
  if (!launchIsActive()) return null;
  const t = await getTranslations({ locale, namespace: "books" });
  const book = LAUNCH_BOOK;

  return (
    <section className={`max-w-5xl w-full mx-auto px-4 ${className}`}>
      <div className="bg-accent/40 border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div className="relative w-32 sm:w-36 shrink-0 rounded-lg overflow-hidden shadow-md" style={{ aspectRatio: "1403/2000" }}>
          <Image
            src={book.cover}
            alt={t("coverAlt", { title: book.coverTitle })}
            fill
            className="object-cover"
            sizes="144px"
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-primary/70 mb-2 block">
            {t("launch.badge")}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground leading-snug">
            {book.title}
          </h2>
          <p className="font-sans text-sm text-muted mt-2">{t("launch.byline")}</p>
          <BuyBookLink
            href={book.href}
            title={book.title}
            className="mt-5 inline-flex items-center justify-center gap-2 font-sans text-sm font-semibold px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary-dark transition-colors"
          >
            {t("launch.button")}
            <ExternalLink className="w-4 h-4" />
          </BuyBookLink>
        </div>
      </div>
    </section>
  );
}
