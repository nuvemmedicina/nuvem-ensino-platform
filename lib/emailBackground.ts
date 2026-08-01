import { after } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { DeliveryResult } from "@/lib/email";

/**
 * Dispara um e-mail depois que a resposta HTTP já foi enviada, sem bloquear o cliente.
 *
 * Por que existe: chamar `sendXEmail(...)` sem `await` funciona em dev e falha em
 * produção. A Vercel congela a instância assim que a resposta é enviada, e a promise
 * pendente do envio morre no meio — sem erro, sem log, sem e-mail. `after()` mantém a
 * invocação viva até o callback terminar.
 *
 * Toda falha é registrada no console E no Sentry: o log de runtime da Vercel tem
 * retenção curta demais para servir de rastro.
 */
export function sendAfterResponse(
  kind: string,
  to: string,
  send: () => Promise<DeliveryResult>,
): void {
  after(async () => {
    try {
      const result = await send();
      if (!result.ok) {
        // O console já foi registrado por `deliver()` em lib/email.ts — aqui só
        // acrescenta o rastro permanente, que o log da Vercel não guarda.
        Sentry.captureMessage(`E-mail não enviado: ${kind}`, {
          level: "error",
          tags: { emailKind: kind },
          extra: { to, error: result.error },
        });
      }
    } catch (e) {
      console.error(`[email] ${kind} → ${to}: exceção no envio`, e);
      Sentry.captureException(e, { tags: { emailKind: kind }, extra: { to } });
    }
  });
}
