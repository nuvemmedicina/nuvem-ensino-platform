import Image from "next/image";
import { Award, Download, BookOpen } from "lucide-react";

export default function TestCertCard() {
  const cards = [
    { id: "a", mask: false },
    { id: "b", mask: true },
  ];
  return (
    <div className="p-16 bg-[#F0F0F0] min-h-screen flex gap-8">
      {cards.map((c) => (
        <div key={c.id} className="w-64">
          <p className="mb-2 font-sans text-sm">{c.mask ? "COM fix (mask)" : "SEM fix"}</p>
          <div
            className="group relative flex flex-col rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-canvas border border-white/10"
            style={c.mask ? { WebkitMaskImage: "-webkit-radial-gradient(white, black)" } : undefined}
          >
            <div className="relative w-full" style={{ paddingBottom: "140%" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-canvas flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary/40" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
              <div className="absolute top-3 right-3">
                <div className="w-9 h-9 rounded-full bg-amber-400/90 border-2 border-amber-300 flex items-center justify-center shadow-lg">
                  <Award className="w-4 h-4 text-amber-900 fill-amber-900" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-12 h-12 rounded-full bg-white/95 shadow-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-10 bg-gradient-to-t from-black via-black/70 to-transparent">
                <h3 className="font-sans text-xs font-semibold text-white leading-snug line-clamp-2 drop-shadow mb-1">
                  Doenças da Cavidade Oral, Halimetria e Sialometria
                </h3>
                <p className="font-sans text-[10px] text-white/50 truncate mb-2">
                  Dr. Wanderley Bertoni · 3h
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[10px] text-amber-400/80">Emitido em 15 de mai. de 2026</span>
                </div>
                <div className="mt-1.5 h-px bg-white/10" />
                <p className="font-mono text-[9px] text-white/30 mt-1.5 tracking-wider">#CMP76Q8RN000</p>
              </div>
            </div>
            <a className="flex items-center justify-center gap-2 w-full py-2.5 font-sans text-xs font-bold text-primary bg-white hover:bg-primary hover:text-white transition-all duration-200 border-t border-white/10">
              <Download className="w-3.5 h-3.5" />
              Baixar certificado
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
