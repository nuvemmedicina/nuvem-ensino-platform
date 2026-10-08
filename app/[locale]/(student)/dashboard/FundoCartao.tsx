import Image from "next/image";

/**
 * Imagem de fundo do curso atrás de um cartão escuro (bg-canvas), com uma
 * camada da mesma cor por cima para o texto branco continuar legível.
 * O cartão precisa de "relative isolate overflow-hidden".
 */
export function FundoCartao({ url }: { url: string | null | undefined }) {
  if (!url) return null;
  return (
    <>
      <Image src={url} alt="" fill sizes="(min-width: 1024px) 60rem, 100vw" className="object-cover -z-20" priority />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-canvas via-canvas/85 to-canvas/55" />
    </>
  );
}
