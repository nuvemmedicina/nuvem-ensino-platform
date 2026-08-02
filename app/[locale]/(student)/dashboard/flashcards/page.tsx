import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Layers } from "lucide-react";
import { auth } from "@/auth";
import { gruposParaUsuario } from "@/lib/flashcards";

export default async function FlashcardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/dashboard/flashcards");

  const role = (session.user as { role?: string }).role;
  const grupos = await gruposParaUsuario(session.user.id, role);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-light text-foreground">Flashcards</h1>
      <p className="font-sans text-sm text-muted mt-1 mb-8">
        Revise os pontos principais dos seus cursos, um card por vez.
      </p>

      {grupos.length === 0 ? (
        <div className="border border-border rounded-2xl px-6 py-16 text-center">
          <Layers className="w-8 h-8 text-muted/40 mx-auto mb-3" />
          <p className="font-sans text-sm text-muted">
            Ainda não há flashcards disponíveis para os seus cursos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map((g) => (
            <Link
              key={g.id}
              href={`/dashboard/flashcards/${g.id}`}
              className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-surface hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-gradient-to-br from-violet-900 to-indigo-950">
                {g.course?.thumbnailUrl && (
                  <Image
                    src={g.course.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover opacity-30"
                  />
                )}
                <span className="absolute top-2.5 left-2.5 font-sans text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-500/90 text-white">
                  {g._count.cards} card{g._count.cards !== 1 ? "s" : ""}
                </span>
                <Layers className="absolute inset-0 m-auto w-8 h-8 text-white/50" />
              </div>

              <div className="flex flex-col gap-1 px-4 py-3">
                <h2 className="font-serif text-base font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
                  {g.title}
                </h2>
                {g.course && (
                  <p className="font-sans text-[11px] text-muted truncate">{g.course.title}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
