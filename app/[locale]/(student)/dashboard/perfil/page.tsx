import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Globe, LifeBuoy, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { FormularioPerfil, BotaoSenha } from "./FormularioPerfil";

const IDIOMAS = [
  { codigo: "pt", nome: "Português" },
  { codigo: "es", nome: "Español" },
  { codigo: "en", nome: "English" },
] as const;

export default async function PerfilPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "novaArea.paginas.perfil" });

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/perfil");

  const [user, cursos, aulas, certificados] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true, specialty: true, crm: true, taxId: true, image: true, createdAt: true },
    }),
    prisma.enrollment.count({ where: { userId: session.user.id, status: { in: ["ACTIVE", "COMPLETED"] } } }),
    prisma.progress.count({ where: { completed: true, enrollment: { userId: session.user.id } } }),
    prisma.certificate.count({ where: { userId: session.user.id } }),
  ]);
  if (!user) redirect("/entrar");

  const dl = locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
  const iniciais = (user.name ?? user.email)
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  async function sair() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  const numeros = [
    { valor: cursos, rotulo: t("cursos", { count: cursos }) },
    { valor: aulas, rotulo: t("aulas", { count: aulas }) },
    { valor: certificados, rotulo: t("certificados", { count: certificados }) },
  ];

  return (
    <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex flex-col gap-6">
        <div>
          <h1 className="font-serif text-4xl font-medium text-foreground leading-tight">{t("titulo")}</h1>
          <p className="font-sans text-[15px] text-muted mt-1">{t("subtitulo")}</p>
        </div>

        {/* ── Cartão de identificação ── */}
        <section className="bg-canvas text-white rounded-3xl px-6 sm:px-8 py-7 flex flex-wrap items-center gap-6">
          <span className="relative w-20 h-20 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
            {user.image ? (
              <Image src={user.image} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <span className="font-sans text-2xl font-semibold">{iniciais || <UserRound className="w-8 h-8" aria-hidden="true" />}</span>
            )}
          </span>
          <div className="flex-1 min-w-[min(100%,16rem)] flex flex-col gap-1">
            <p className="font-serif text-3xl font-medium leading-tight">{user.name}</p>
            <p className="font-sans text-sm text-white/70">{user.email}</p>
            <p className="font-sans text-sm text-white/70">
              {[user.specialty, user.crm].filter(Boolean).join(" · ")}
              {(user.specialty || user.crm) && " · "}
              {t("desde", { data: new Intl.DateTimeFormat(dl, { month: "long", year: "numeric" }).format(user.createdAt) })}
            </p>
          </div>
          <dl className="flex gap-6 sm:gap-8">
            {numeros.map((n) => (
              <div key={n.rotulo} className="flex flex-col">
                <dt className="sr-only">{n.rotulo}</dt>
                <dd className="font-sans text-3xl font-semibold tabular-nums leading-none">{n.valor}</dd>
                <span className="font-sans text-xs text-white/70 mt-1" aria-hidden="true">{n.rotulo}</span>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Dados pessoais ── */}
        <section className="bg-surface border border-border rounded-2xl p-5 sm:p-7">
          <h2 className="font-sans text-lg font-semibold text-foreground mb-5">{t("dados")}</h2>
          <FormularioPerfil
            dados={{
              nome: user.name ?? "",
              telefone: user.phone ?? "",
              especialidade: user.specialty ?? "",
              crm: user.crm ?? "",
              email: user.email,
              cpf: user.taxId,
            }}
          />
        </section>

        <div className="grid gap-6 md:grid-cols-2 items-start">
          {/* ── Idioma ── */}
          <section className="bg-surface border border-border rounded-2xl p-5 sm:p-7 flex flex-col gap-3">
            <h2 className="font-sans text-lg font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" aria-hidden="true" />
              {t("idioma")}
            </h2>
            <div role="group" aria-label={t("idioma")} className="flex flex-wrap gap-2">
              {IDIOMAS.map((i) => (
                <a
                  key={i.codigo}
                  href={`/${i.codigo}/dashboard/perfil`}
                  aria-current={locale === i.codigo ? "true" : undefined}
                  className={`min-h-[44px] px-4 inline-flex items-center rounded-full border font-sans text-sm ${
                    locale === i.codigo
                      ? "border-primary bg-primary text-white font-semibold"
                      : "border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  {i.nome}
                </a>
              ))}
            </div>
            <p className="font-sans text-sm text-muted">{t("idiomaAjuda")}</p>
          </section>

          {/* ── Acesso e ajuda ── */}
          <section className="bg-surface border border-border rounded-2xl p-5 sm:p-7 flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <h2 className="font-sans text-lg font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
                {t("acesso")}
              </h2>
              <BotaoSenha email={user.email} />
            </div>
            <div className="flex flex-col gap-2 pt-5 border-t border-border">
              <h2 className="font-sans text-lg font-semibold text-foreground flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-primary" aria-hidden="true" />
                {t("ajuda")}
              </h2>
              <Link
                href="https://wa.me/5531972291029"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm font-semibold text-primary hover:underline w-fit"
              >
                {t("whatsapp")} →
              </Link>
              <p className="font-sans text-sm text-muted">cursos@nuvemensino.com.br</p>
            </div>
            <form action={sair} className="pt-5 border-t border-border">
              <button type="submit" className="inline-flex items-center gap-2 min-h-[44px] font-sans text-sm text-muted hover:text-foreground">
                <LogOut className="w-4 h-4" aria-hidden="true" />
                {t("sair")}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
