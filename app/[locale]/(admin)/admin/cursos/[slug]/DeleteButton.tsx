"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";

interface Props {
  action: () => Promise<void>;
  confirm: string;
  className?: string;
  /** Nome do botão para leitores de tela e dica ao passar o mouse. */
  rotulo?: string;
}

export function DeleteButton({ action, confirm: confirmMsg, className, rotulo = "Excluir" }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      aria-label={rotulo}
      title={rotulo}
      onClick={() => {
        if (!window.confirm(confirmMsg)) return;
        startTransition(() => action());
      }}
    >
      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );
}
