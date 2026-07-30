/**
 * Endereço público da plataforma — fonte única de verdade.
 *
 * O domínio canônico é o com `www`: nuvemensino.com.br responde 308 e
 * redireciona para www.nuvemensino.com.br. Usar o canônico direto evita um
 * salto de redirecionamento em links de e-mail, retornos de pagamento,
 * sitemap e metadados.
 *
 * Nunca termina em barra: o código concatena o caminho direto
 * (`${APP_URL}/entrar`), então uma barra sobrando geraria `//entrar`.
 * O replace protege contra a variável ser configurada com barra no fim.
 */
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nuvemensino.com.br"
).replace(/\/+$/, "");
