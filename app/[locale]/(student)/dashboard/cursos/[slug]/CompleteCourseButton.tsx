"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Award } from "lucide-react";
import { completeCourse } from "./completeCourseAction";

export function CompleteCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleComplete() {
    if (!confirm("Confirmar sua participação e gerar o certificado de conclusão?")) return;
    startTransition(async () => {
      try {
        await completeCourse(courseId);
        setDone(true);
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 font-sans text-sm font-semibold text-green-600">
        <Award className="w-4 h-4" />
        Certificado emitido! Acesse em Certificados.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleComplete}
        disabled={isPending}
        className="inline-flex items-center gap-2 font-sans text-sm font-semibold px-6 py-2.5 rounded-full border border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        {isPending ? "Processando…" : "Marcar como concluído e gerar certificado"}
      </button>
      {error && <p className="font-sans text-xs text-red-500">{error}</p>}
    </div>
  );
}
