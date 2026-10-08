"use client";

/**
 * Botão de envio que pede confirmação antes. Sem `confirmar`, envia direto.
 * Usado nas setas de mover módulo: um clique sem querer mudava a ordem do
 * curso para todos os alunos.
 */
export function BotaoConfirmar({
  confirmar,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { confirmar?: string }) {
  return (
    <button
      type="submit"
      {...props}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
