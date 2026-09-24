import { after } from "next/server";
import * as Sentry from "@sentry/nextjs";

type PurchaseEventInput = {
  clientId: string | null;
  value: number;
  currency: string;
  courseSlug: string;
  courseTitle: string;
  courseCategory?: string | null;
  paymentMethod: string;
  couponCode?: string | null;
};

/**
 * Manda o evento "purchase" direto pro GA4 pelo lado do servidor (API de
 * Medição, Measurement Protocol), no momento em que o pagamento é
 * confirmado de verdade pelo webhook da Asaas. Não usa a página de
 * "?sucesso=1" porque essa URL é alcançada assim que o boleto é gerado ou
 * o PIX aparece na tela, não quando o pagamento é de fato liquidado, o que
 * contaria venda pendente como venda fechada.
 *
 * Só envia se existir um client_id (ver lib/gaClientId.ts) e as variáveis
 * de ambiente estiverem configuradas: sem consentimento de analytics, não
 * existe o cookie do GA4 no navegador da pessoa, então não há correlação
 * possível, e a venda simplesmente fica fora da medição (mas continua
 * registrada normalmente no banco de dados, sem nenhum impacto na compra
 * em si).
 */
export function sendGA4PurchaseEvent(input: PurchaseEventInput): void {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!input.clientId || !measurementId || !apiSecret) return;

  after(async () => {
    try {
      const res = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
        {
          method: "POST",
          body: JSON.stringify({
            client_id: input.clientId,
            events: [
              {
                name: "purchase",
                params: {
                  currency: input.currency,
                  value: input.value,
                  payment_method: input.paymentMethod,
                  coupon: input.couponCode ?? undefined,
                  items: [
                    {
                      item_id: input.courseSlug,
                      item_name: input.courseTitle,
                      item_category: input.courseCategory ?? undefined,
                      price: input.value,
                      quantity: 1,
                    },
                  ],
                },
              },
            ],
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[ga4-mp] purchase não aceito, status ${res.status}: ${text}`);
        Sentry.captureMessage("GA4 Measurement Protocol: purchase rejeitado", {
          level: "warning",
          extra: { status: res.status, body: text },
        });
      }
    } catch (e) {
      console.error("[ga4-mp] falha ao enviar purchase", e);
      Sentry.captureException(e, { tags: { ga4mp: "purchase" } });
    }
  });
}
