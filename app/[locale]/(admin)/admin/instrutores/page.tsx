import { prisma } from "@/lib/prisma";
import { GraduationCap } from "lucide-react";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";
import { getTranslations } from "next-intl/server";
import { InstructorCard } from "./InstructorCard";
import { CreateInstructorForm } from "./CreateInstructorForm";

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
      <CabecalhoAdmin
        titulo={t("instructors")}
        subtitulo={`${instructors.length} instrutor${instructors.length !== 1 ? "es" : ""} cadastrado${instructors.length !== 1 ? "s" : ""}`}
        icone={GraduationCap}
      />

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
        <CreateInstructorForm />
      </section>
    </div>
  );
}
