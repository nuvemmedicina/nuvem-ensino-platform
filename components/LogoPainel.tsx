import Link from "next/link";
import Image from "next/image";

/**
 * Logo dos painéis (aluno, admin e instrutor): a nuvem no círculo azul, em
 * destaque. O site público e as telas de login continuam com /logo.png.
 */
export function LogoPainel({ href = "/", variante = "lateral" }: { href?: string; variante?: "lateral" | "celular" }) {
  if (variante === "celular") {
    return (
      <Link href={href} className="flex items-center gap-2.5 shrink-0" aria-label="NU.V.E.M ENSINO">
        <Image src="/logo-icone.png" alt="" width={40} height={40} className="w-10 h-10" priority />
        <span className="font-serif text-[22px] font-semibold text-primary leading-none">nuvem</span>
      </Link>
    );
  }
  return (
    <Link href={href} className="flex items-center gap-3" aria-label="NU.V.E.M ENSINO">
      <Image src="/logo-icone.png" alt="" width={56} height={56} className="w-14 h-14 shrink-0" priority />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[26px] font-semibold text-primary">nuvem</span>
        <span className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-muted mt-1">ensino</span>
      </span>
    </Link>
  );
}
