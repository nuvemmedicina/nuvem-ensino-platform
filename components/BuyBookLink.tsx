"use client";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** Sem dado pessoal: só confirma o clique em "comprar" e qual livro. Ver
 * docs/medicao/04-livros-clique-compra.md. A compra em si acontece na
 * Rubio, fora do nosso domínio, então esse clique é o sinal mais próximo
 * de intenção de compra que conseguimos medir do nosso lado. */
function itemIdFromHref(href: string): string {
  const match = href.match(/\/([^/]+)\.html$/);
  return match ? match[1] : href;
}

function pushBookClick(title: string, href: string) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "select_content",
    content_type: "livro",
    item_id: itemIdFromHref(href),
    item_name: title,
  });
}

export function BuyBookLink({
  href,
  title,
  className,
  children,
}: {
  href: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => pushBookClick(title, href)}
      className={className}
    >
      {children}
    </a>
  );
}
