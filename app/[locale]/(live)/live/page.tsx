import Image from "next/image";
import type { Metadata } from "next";
import LiveRegistrationForm from "./LiveRegistrationForm";

export const metadata: Metadata = {
  title: "Live Exclusiva — Curso DICI · NU.V.E.M ENSINO",
  description:
    "Participe da live com a Dra. Vera Ângelo sobre o Curso de Aperfeiçoamento em DICI e garanta um desconto exclusivo para os presentes.",
};

export default function LivePage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Painel da foto ── */}
      <div className="relative h-[56vw] max-h-[480px] lg:h-screen lg:max-h-none lg:sticky lg:top-0 overflow-hidden bg-[#003344]">
        <div className="absolute inset-0">
          <Image
            src="/instructors/dra-vera-angelo-1.jpeg"
            alt="Dra. Vera Ângelo"
            fill
            className="object-cover object-center lg:object-[center_15%]"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#001820] via-[#001820]/10 to-[#001820]/5" />
        </div>

        {/* Logo branca — topo */}
        <div className="absolute top-6 left-6 z-10">
          <Image
            src="/nuvem-ensino-branca.png"
            alt="NU.V.E.M ENSINO"
            width={130}
            height={105}
            className="h-11 w-auto drop-shadow-md"
          />
        </div>

        {/* Legenda + Selo MEC — rodapé */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-8 pb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#C9A84C] mb-2">
              Apresentação
            </p>
            <h2
              className="text-white text-2xl font-normal leading-snug"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Dra. Vera Ângelo
            </h2>
            <p className="text-white/55 text-sm mt-1 leading-relaxed">
              Especialista em Neurogastroenterologia<br className="hidden lg:block" /> e Motilidade Digestiva
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/selo-mec-nuvem.svg"
            alt="Selo MEC"
            height={72}
            className="h-16 w-auto shrink-0 drop-shadow-lg"
          />
        </div>
      </div>

      {/* ── Painel do formulário ── */}
      <div className="bg-white dark:bg-[#132830] flex flex-col justify-center px-8 py-14 lg:px-16 lg:py-20">
        {/* Badge ao vivo */}
        <div className="inline-flex items-center gap-2 bg-red-600 text-white text-[10px] font-black tracking-[0.18em] uppercase px-3.5 py-1.5 rounded-full w-fit mb-7 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          Live Exclusiva · 24/07 às 19h30
        </div>

        <h1
          className="text-[#00475E] dark:text-[#1A8CAA] leading-[1.15] mb-4"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(1.55rem, 3vw, 2.3rem)",
            fontWeight: "normal",
          }}
        >
          Descubra o Curso que vai{" "}
          <em className="not-italic text-[#0C1E24] dark:text-white">transformar</em>{" "}
          sua prática clínica em DICI
        </h1>

        <p className="text-sm text-[#5C747A] dark:text-[#8AADB5] leading-relaxed max-w-[44ch] mb-7">
          A Dra. Vera Ângelo vai apresentar ao vivo o Curso de Aperfeiçoamento
          em DICI e revelar, com exclusividade para os presentes, uma condição
          especial de matrícula.
        </p>

        {/* Box de desconto */}
        <div className="flex items-start gap-3 bg-[#F5EDD4] dark:bg-[#2A2210] border border-[#B8973A] rounded-xl px-4 py-3.5 mb-8">
          <span className="text-xl mt-0.5 shrink-0">🎁</span>
          <p className="text-sm text-[#0C1E24] dark:text-[#EAE6E0] leading-relaxed">
            <strong className="text-[#B8973A] font-bold">Desconto exclusivo para participantes da live.</strong>
            <br />
            Válido apenas durante a transmissão. Garanta sua presença para aproveitar.
          </p>
        </div>

        <div className="h-px bg-[#D8D2C8] dark:bg-[#1E3540] mb-8" />

        <LiveRegistrationForm />

        {/* Selos ISO + MEC */}
        <div className="mt-10 pt-8 border-t border-[#D8D2C8] dark:border-[#1E3540] flex justify-center">
          <Image
            src="/selos-iso-mec.png"
            alt="Certificações ISO 9001 e Reconhecido pelo MEC"
            width={300}
            height={130}
            className="h-20 w-auto"
          />
        </div>
      </div>
    </div>
  );
}
