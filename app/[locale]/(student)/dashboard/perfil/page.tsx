import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { User } from "lucide-react";

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";
const labelClass =
  "block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/perfil");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, specialty: true, crm: true },
  });

  if (!user) redirect("/entrar");

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-foreground">Perfil</h1>
        <p className="font-sans text-sm text-muted mt-1">Suas informações de cadastro.</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="font-sans text-xl font-semibold text-primary">
              {user.name?.[0]?.toUpperCase() ?? <User className="w-6 h-6" />}
            </span>
          </div>
          <div>
            <p className="font-serif text-lg font-medium text-foreground">{user.name}</p>
            <p className="font-sans text-sm text-muted">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nome completo</label>
            <input readOnly value={user.name ?? ""} className={`${inputClass} bg-background/50 cursor-default`} />
          </div>
          <div>
            <label className={labelClass}>E-mail</label>
            <input readOnly value={user.email} className={`${inputClass} bg-background/50 cursor-default`} />
          </div>
          {user.phone && (
            <div>
              <label className={labelClass}>Telefone</label>
              <input readOnly value={user.phone} className={`${inputClass} bg-background/50 cursor-default`} />
            </div>
          )}
          {user.specialty && (
            <div>
              <label className={labelClass}>Especialidade</label>
              <input readOnly value={user.specialty} className={`${inputClass} bg-background/50 cursor-default`} />
            </div>
          )}
          {user.crm && (
            <div>
              <label className={labelClass}>CRM</label>
              <input readOnly value={user.crm} className={`${inputClass} bg-background/50 cursor-default`} />
            </div>
          )}
        </div>

        <p className="font-sans text-xs text-muted mt-6">
          Para alterar seus dados, entre em contato: <a href="mailto:cursos@nuvemensino.com.br" className="text-primary hover:underline">cursos@nuvemensino.com.br</a>
        </p>
      </div>
    </div>
  );
}
