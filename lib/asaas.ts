/**
 * Asaas REST API client
 * Docs: https://docs.asaas.com
 */

const BASE_URL =
  process.env.ASAAS_SANDBOX === "true"
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/v3";

async function req<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurado.");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "access_token": apiKey,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asaas ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AsaasCustomer = { id: string; name: string; email: string };
export type AsaasBillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

export type AsaasPayment = {
  id: string;
  status: string;
  value: number;
  billingType: AsaasBillingType;
  invoiceUrl: string;
  bankSlipUrl: string | null;
  dueDate: string;
};

export type AsaasPixQrCode = {
  encodedImage: string;   // base64 PNG
  payload: string;        // copia e cola
  expirationDate: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns an ISO date string N minutes from now (YYYY-MM-DD format) */
function isoDate(minutesFromNow = 0): string {
  const d = new Date(Date.now() + minutesFromNow * 60_000);
  return d.toISOString().slice(0, 10);
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function findOrCreateCustomer(
  email: string,
  name: string,
  cpfCnpj?: string,
): Promise<AsaasCustomer> {
  const list = await req<{ data: AsaasCustomer[] }>(
    `/customers?email=${encodeURIComponent(email)}&limit=1`,
  );
  if (list.data.length > 0) {
    const existing = list.data[0];
    // Atualiza CPF se ainda não estava cadastrado
    if (cpfCnpj && !existing.cpfCnpj) {
      await req(`/customers/${existing.id}`, {
        method: "PUT",
        body: JSON.stringify({ cpfCnpj }),
      });
    }
    return existing;
  }

  return req<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({ name, email, ...(cpfCnpj ? { cpfCnpj } : {}) }),
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

interface CreatePaymentInput {
  customerId: string;
  billingType: AsaasBillingType;
  value: number;
  description: string;
  externalReference: string; // enrollment ID — used in webhook
  installmentCount?: number;
  successUrl?: string;
}

export async function createPayment(
  input: CreatePaymentInput,
): Promise<AsaasPayment> {
  const dueDays =
    input.billingType === "BOLETO"
      ? 3   // 3 business days
      : input.billingType === "PIX"
      ? 0   // today (expires same day)
      : 1;  // credit card — next day

  return req<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customerId,
      billingType: input.billingType,
      value: input.value,
      dueDate: isoDate(dueDays === 0 ? 30 : dueDays * 24 * 60),
      description: input.description,
      externalReference: input.externalReference,
      ...(input.installmentCount && input.installmentCount > 1
        ? { installmentCount: input.installmentCount, installmentValue: +(input.value / input.installmentCount).toFixed(2) }
        : {}),
      ...(input.successUrl
        ? { callback: { successUrl: input.successUrl, autoRedirect: true } }
        : {}),
    }),
  });
}

// ─── PIX QR Code ──────────────────────────────────────────────────────────────

export async function getPixQrCode(
  paymentId: string,
): Promise<AsaasPixQrCode> {
  return req<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}
