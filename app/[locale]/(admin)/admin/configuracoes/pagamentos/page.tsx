import { prisma } from "@/lib/prisma";
import { CheckCircle, CreditCard } from "lucide-react";
import { MercadoPagoConnect } from "./MercadoPagoConnect";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mp_ok?: string; mp_error?: string }>;
};

export default async function PagamentosPage({ searchParams }: Props) {
  const { mp_ok, mp_error } = await searchParams;

  const [mpToken, mpUserId, stripeKey] = await Promise.all([
    prisma.platformSetting.findUnique({ where: { key: "mp_access_token" } }),
    prisma.platformSetting.findUnique({ where: { key: "mp_user_id" } }),
    Promise.resolve(process.env.STRIPE_SECRET_KEY),
  ]);

  const mpConnected = !!mpToken?.value;
  const stripeConnected = !!stripeKey;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-foreground">Pagamentos</h1>
        <p className="font-sans text-sm text-muted mt-1">Configure os meios de pagamento aceitos na plataforma.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Stripe */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-sans text-base font-semibold text-foreground">Stripe</h2>
              <p className="font-sans text-xs text-muted mt-0.5">Cartão internacional (Visa, Mastercard, Amex)</p>
            </div>
            {stripeConnected ? (
              <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Configurado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-muted bg-border/50 border border-border px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-muted/50" />
                Não configurado
              </span>
            )}
          </div>
          {stripeConnected ? (
            <div className="mt-4 flex items-center gap-2 font-sans text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Chaves configuradas nas variáveis de ambiente da Vercel.
            </div>
          ) : (
            <div className="mt-4">
              <p className="font-sans text-sm text-muted">
                Adicione <code className="bg-background px-1 rounded text-xs">STRIPE_SECRET_KEY</code> e{" "}
                <code className="bg-background px-1 rounded text-xs">STRIPE_WEBHOOK_SECRET</code> nas variáveis de ambiente da Vercel.
              </p>
            </div>
          )}
        </div>

        {/* Mercado Pago */}
        <MercadoPagoConnect
          isConnected={mpConnected}
          mpUserId={mpUserId?.value ?? null}
          mpOk={mp_ok === "1"}
          mpError={mp_error ? decodeURIComponent(mp_error) : null}
        />

        {/* Info */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-muted shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-sans text-sm font-semibold text-foreground">Como funciona o link do Mercado Pago</p>
              <ul className="font-sans text-xs text-muted space-y-1.5 list-disc list-inside">
                <li>O link não tem prazo de validade — envie para Dra. Vera quando quiser</li>
                <li>Ela clica, faz login na conta MP dela e autoriza a plataforma</li>
                <li>Após autorizar, a conta dela fica conectada automaticamente</li>
                <li>PIX, Boleto e Cartão parcelado ficam disponíveis no checkout</li>
                <li>Os pagamentos vão direto para a conta MP dela</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
