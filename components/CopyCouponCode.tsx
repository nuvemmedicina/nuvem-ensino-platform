"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Props = {
  code: string;
  className?: string;
};

export default function CopyCouponCode({ code, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível (ex: contexto não seguro) — ignora silenciosamente.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Copiar cupom"
      className={`inline-flex items-center gap-1.5 font-mono font-semibold hover:opacity-80 transition-opacity cursor-pointer ${className}`}
    >
      {code}
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[0.9em]">Copiado!</span>
        </>
      ) : (
        <Copy className="w-3.5 h-3.5 shrink-0" />
      )}
    </button>
  );
}
