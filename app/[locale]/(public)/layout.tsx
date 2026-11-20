import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // O Next monta os layouts em paralelo, então o setRequestLocale do layout
  // raiz pode não ter rodado quando o rodapé pede as traduções. Sem o idioma
  // informado aqui, o next-intl lê os cabeçalhos e todas as páginas públicas
  // deixam de sair do cache.
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col min-h-full bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
