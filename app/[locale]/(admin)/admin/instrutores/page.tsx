import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { InstructorCard } from "./InstructorCard";
import { createInstructor } from "./actions";

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";
const labelClass =
  "block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminInstrutoresPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.nav" });

  const instructors = await prisma.instructor.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      _count: { select: { courses: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">
          {t("instructors")}
        </h1>
        <p className="font-sans text-sm text-muted mt-1">
          {instructors.length} instrutor{instructors.length !== 1 ? "es" : ""} cadastrado{instructors.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Lista de instrutores */}
      <div className="flex flex-col gap-3 mb-10">
        {instructors.length === 0 ? (
          <p className="font-sans text-sm text-muted">Nenhum instrutor cadastrado ainda.</p>
        ) : (
          instructors.map((inst) => (
            <InstructorCard key={inst.id} instructor={inst} />
          ))
        )}
      </div>

      {/* Formulário de cadastro */}
      <section className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-muted mb-5">
          Adicionar instrutor
        </h2>
        <form action={createInstructor} className="space-y-4">
          <div>
            <label className={labelClass}>E-mail da conta (já deve existir no sistema)</label>
            <input
              name="email"
              type="email"
              required
              placeholder="dra.vera@exemplo.com"
              className={inputClass}
            />
            <p className="font-sans text-[10px] text-muted mt-1">
              O usuário será encontrado pelo e-mail e seu papel mudará automaticamente para Instrutor.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Título / Especialidade</label>
              <input
                name="title"
                placeholder="Ex: Dra. · Gastroenterologista"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>CRM</label>
              <input name="crm" placeholder="Ex: CRM-MG 12345" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>RQE (opcional)</label>
              <input name="rqe" placeholder="Ex: RQE 67890" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>URL da foto (opcional)</label>
              <input name="photoUrl" type="url" placeholder="https://..." className={inputClass} />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              Cadastrar instrutor
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
