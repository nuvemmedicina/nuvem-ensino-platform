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

export type AsaasCustomer = { id: string; name: string; email: string; cpfCnpj?: string };
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
  // Busca primeiro pelo CPF/CNPJ (chave real de identidade no Asaas) para não criar
  // um cliente duplicado quando o aluno usa uma conta/e-mail diferente da plataforma.
  if (cpfCnpj) {
    const byCpf = await req<{ data: AsaasCustomer[] }>(
      `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}&limit=1`,
    );
    if (byCpf.data.length > 0) return byCpf.data[0];
  }

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

export type AsaasAddress = {
  postalCode: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
};

/** Grava o endereço no cliente do Asaas: sem endereço completo com CEP, a nota fiscal é recusada. */
export async function updateCustomerAddress(customerId: string, addr: AsaasAddress): Promise<void> {
  await req(`/customers/${customerId}`, {
    method: "PUT",
    body: JSON.stringify({
      postalCode: addr.postalCode,
      address: addr.address,
      addressNumber: addr.addressNumber,
      complement: addr.complement || undefined,
      province: addr.province,
    }),
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

/** Cancela uma cobrança pendente no Asaas (usado ao substituir uma cobrança expirada/abandonada). */
export async function cancelAsaasPayment(paymentId: string): Promise<void> {
  await req(`/payments/${paymentId}`, { method: "DELETE" });
}

// ─── Notas fiscais (NFS-e) ────────────────────────────────────────────────────
// Docs: https://docs.asaas.com/docs/emitindo-notas-fiscais-de-servico

export type AsaasInvoice = {
  id: string;
  status: string;
  number: string | null;
  pdfUrl: string | null;
};

export type CreateInvoiceInput = {
  /** Cobrança paga (pagamento à vista). */
  payment?: string;
  /** Cliente (nota avulsa, usada no parcelado para sair uma nota só com o total). */
  customer?: string;
  externalReference: string;
  serviceDescription: string;
  observations: string;
  value: number;
  effectiveDate: string; // YYYY-MM-DD
  municipalServiceCode: string;
  municipalServiceName: string;
  taxes: {
    retainIss: boolean;
    iss: number;
    pis: number;
    cofins: number;
    csll: number;
    inss: number;
    ir: number;
    nbsCode?: string;
  };
};

/** Agenda a nota. Ela só vale como emitida quando chega o webhook INVOICE_AUTHORIZED. */
export async function createInvoice(input: CreateInvoiceInput): Promise<AsaasInvoice> {
  return req<AsaasInvoice>("/invoices", {
    method: "POST",
    body: JSON.stringify({ ...input, deductions: 0 }),
  });
}

/** Cancela a nota (depende de a prefeitura/Portal Nacional aceitar cancelamento automático). */
export async function cancelInvoice(invoiceId: string): Promise<void> {
  await req(`/invoices/${invoiceId}/cancel`, { method: "POST" });
}

// ─── PIX QR Code ──────────────────────────────────────────────────────────────

export async function getPixQrCode(
  paymentId: string,
): Promise<AsaasPixQrCode> {
  return req<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}
