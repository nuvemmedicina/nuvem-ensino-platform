"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Award } from "lucide-react";

export function CertificateCard({
  id,
  courseTitle,
  thumbnailUrl,
  issueDate,
}: {
  id: string;
  courseTitle: string;
  thumbnailUrl: string | null;
  issueDate: Date;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -10;
    const rotateY = ((x - cx) / cx) * 10;
    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04,1.04,1.04)`;

    if (glowRef.current) {
      glowRef.current.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(251,191,36,0.18) 0%, transparent 70%)`;
    }
  }

  function onMouseLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    if (glowRef.current) glowRef.current.style.background = "transparent";
  }

  return (
    <Link
      ref={cardRef}
      href="/dashboard/certificados"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative flex flex-col overflow-hidden rounded-2xl transition-[box-shadow] duration-300 hover:shadow-2xl hover:shadow-amber-500/25"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        willChange: "transform",
        transformStyle: "preserve-3d",
        transition: "transform 0.08s ease-out, box-shadow 0.3s ease",
      }}
    >
      {/* Glow seguindo o mouse */}
      <div ref={glowRef} className="pointer-events-none absolute inset-0 z-10 rounded-2xl transition-[background] duration-100" />

      {/* Poster */}
      <div className="relative overflow-hidden" style={{ paddingBottom: "140%" }}>
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={courseTitle}
            fill
            className="absolute inset-0 object-cover"
            sizes="(max-width: 640px) 50vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 to-amber-600/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        {/* Selo */}
        <div
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center backdrop-blur-sm"
          style={{ transform: "translateZ(20px)" }}
        >
          <Award className="w-5 h-5 text-amber-300" />
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3" style={{ transform: "translateZ(10px)" }}>
          <p className="font-sans text-[9px] font-bold uppercase tracking-widest text-amber-400 mb-1">Certificado</p>
          <p className="font-sans text-sm font-bold text-white leading-snug line-clamp-3">{courseTitle}</p>
          <p className="font-sans text-[10px] text-white/50 mt-2">
            {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(issueDate))}
          </p>
        </div>
      </div>
    </Link>
  );
}
