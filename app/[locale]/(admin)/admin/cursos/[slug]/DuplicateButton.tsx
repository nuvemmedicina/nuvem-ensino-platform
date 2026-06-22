"use client";

import { Copy } from "lucide-react";
import { useTransition } from "react";

interface Props {
  action: () => Promise<void>;
  className?: string;
}

export function DuplicateButton({ action, className }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      title="Duplicar curso"
      className={className}
      onClick={() => startTransition(() => action())}
    >
      {pending ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
