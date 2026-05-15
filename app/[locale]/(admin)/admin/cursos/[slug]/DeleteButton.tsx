"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";

interface Props {
  action: () => Promise<void>;
  confirm: string;
  className?: string;
}

export function DeleteButton({ action, confirm: confirmMsg, className }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => {
        if (!window.confirm(confirmMsg)) return;
        startTransition(() => action());
      }}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
