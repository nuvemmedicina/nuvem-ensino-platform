"use client";

import { Share2 } from "lucide-react";

export default function ShareButton({ title, url }: { title: string; url: string }) {
  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      alert("Link copiado!");
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Compartilhar curso"
      className="flex items-center gap-1.5 font-sans text-xs text-white/50 hover:text-white/80 transition-colors"
    >
      <Share2 className="w-3.5 h-3.5" />
      Compartilhar
    </button>
  );
}
