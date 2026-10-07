import Link from "next/link";
import Image from "next/image";

/**
 * Logo dos painéis (aluno, admin e instrutor): só a nuvem no círculo azul,
 * sem texto, em destaque. O site público e as telas de login continuam com
 * /logo.png.
 */
export function LogoPainel({ href = "/", variante = "lateral" }: { href?: string; variante?: "lateral" | "celular" }) {
  const tamanho = variante === "celular" ? 44 : 64;
  return (
    <Link href={href} className="inline-flex shrink-0" aria-label="NU.V.E.M ENSINO">
      <Image
        src="/logo-icone.png"
        alt=""
        width={tamanho}
        height={tamanho}
        className={variante === "celular" ? "w-11 h-11" : "w-16 h-16"}
        priority
      />
    </Link>
  );
}
