import { after } from "next/server";
import * as Sentry from "@sentry/nextjs";

type PurchaseEventInput = {
  fbp: string | null;
  fbc?: string | null;
  value: number;
  currency: string;
  courseSlug: string;
};

/**
 * Manda o evento "Purchase" direto pro Meta (API de Conversões), no mesmo
 * momento e pela mesma razão do evento equivalente do GA4 (ver
 * lib/ga4MeasurementProtocol.ts): o webhook da Asaas é a única fonte
 * confiável de "pagamento realmente recebido" para PIX, boleto e cartão
 * parcelado, a página "?sucesso=1" não é.
 *
 * Só envia se existir um `fbp` (ver lib/fbClientId.ts) e as variáveis de
 * ambiente estiverem configuradas: sem consentimento de publicidade, não
 * existe o cookie do Meta Pixel no navegador da pessoa, então não há
 * correlação possível, e a venda simplesmente fica fora dessa medição (mas
 * continua registrada normalmente no banco de dados).
 *
 * Nenhum dado pessoal é enviado: nada de nome, e-mail, telefone ou CPF,
 * mesmo com hash, só o identificador técnico do navegador e os dados da
 * compra em si (valor, moeda, curso).
 */
export function sendMetaPurchaseEvent(input: PurchaseEventInput): void {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN;

  if (!input.fbp || !pixelId || !accessToken) return;

  after(async () => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: [
              {
                event_name: "Purchase",
                event_time: Math.floor(Date.now() / 1000),
                action_source: "website",
                user_data: { fbp: input.fbp, fbc: input.fbc ?? undefined },
                custom_data: {
                  currency: input.currency,
                  value: input.value,
                  content_type: "product",
                  content_ids: [input.courseSlug],
                  contents: [{ id: input.courseSlug, quantity: 1, item_price: input.value }],
                },
              },
            ],
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[meta-capi] purchase não aceito, status ${res.status}: ${text}`);
        Sentry.captureMessage("Meta Conversions API: purchase rejeitado", {
          level: "warning",
          extra: { status: res.status, body: text },
        });
      }
    } catch (e) {
      console.error("[meta-capi] falha ao enviar purchase", e);
      Sentry.captureException(e, { tags: { metaCapi: "purchase" } });
    }
  });
}
