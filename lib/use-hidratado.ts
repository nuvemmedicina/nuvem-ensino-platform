"use client";

import { useSyncExternalStore } from "react";

const semAssinatura = () => () => {};

/**
 * `false` no HTML vindo do servidor e durante a hidratação; `true` assim que o
 * React assume a página no navegador.
 *
 * Usado nos formulários de autenticação para manter o botão de envio
 * desabilitado enquanto o `onSubmit` ainda não existe. Sem isso, quem clica
 * (ou aperta Enter) antes de o JavaScript carregar faz o navegador enviar o
 * formulário sozinho — e, sem `method`, isso vira um GET com a senha na URL,
 * que fica no histórico, nos logs do servidor e em qualquer proxy no caminho.
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    semAssinatura,
    () => true,
    () => false,
  );
}
