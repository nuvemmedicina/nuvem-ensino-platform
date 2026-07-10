"use client";

import { useTransition } from "react";

export function RemoveVideoButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="ml-2 font-sans text-[10px] text-red-400 hover:text-red-600 hover:underline transition-colors disabled:opacity-50"
      onClick={() => {
        if (!window.confirm("Remover o vídeo desta aula? O botão de upload voltará a aparecer.")) return;
        startTransition(() => action());
      }}
    >
      {pending ? "Removendo…" : "Remover vídeo"}
    </button>
  );
}
