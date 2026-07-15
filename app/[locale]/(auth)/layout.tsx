import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* ── Lado esquerdo — imagem da marca (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <Image
          src="/capa-2.jpeg"
          alt="NU.V.E.M ENSINO"
          fill
          className="object-cover"
          priority
          sizes="52vw"
        />
        <div className="absolute inset-0 bg-canvas/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/20 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/">
            <Image
              src="/nuvem-ensino-branca.png"
              alt="NU.V.E.M ENSINO"
              width={140}
              height={110}
              className="h-10 w-auto"
            />
          </Link>
          <div>
            <p className="font-sans text-sm font-bold uppercase tracking-widest text-white/50 mb-4">
              Formação médica contínua
            </p>
            <h2 className="font-serif text-5xl xl:text-6xl font-light text-white leading-[1.1] max-w-lg">
              O conhecimento que transforma a sua prática clínica
            </h2>
          </div>
        </div>
      </div>

      {/* ── Lado direito — formulário ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Logo mobile */}
        <div className="lg:hidden px-6 pt-8 pb-2">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="NU.V.E.M ENSINO"
              width={120}
              height={94}
              className="h-9 w-auto"
            />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>

        <p className="text-center font-sans text-[11px] text-muted/50 pb-6">
          © {new Date().getFullYear()} NU.V.E.M ENSINO · CNPJ 42.679.051/0001-31
        </p>
      </div>

    </div>
  );
}
