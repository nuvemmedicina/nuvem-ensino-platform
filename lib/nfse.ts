/**
 * Nota fiscal de serviço (NFS-e) pelo Asaas, pedida quando o pagamento é confirmado.
 *
 * Desligada até ASAAS_NFSE_ATIVO=true: antes disso a configuração fiscal precisa
 * estar pronta no painel do Asaas (Notas Fiscais > Configurações: certificado A1,
 * inscrição municipal, série). Os valores padrão abaixo vêm da nota nº 19, emitida
 * pelo Portal Nacional em 21/10/2026 (Simples Nacional, ISS não retido).
 *
 * Uma nota por compra, com o valor total: à vista ela fica ligada à cobrança; no
 * parcelado ela sai avulsa (ligada ao cliente), porque depois que o cartão é
 * aprovado o Asaas só aceita nota por parcela ou avulsa.
 */
import { prisma } from "@/lib/prisma";
import { createInvoice, cancelInvoice } from "@/lib/asaas";
import { sendAlertaNotaFiscal } from "@/lib/email";

export function nfseAtiva(): boolean {
  return process.env.ASAAS_NFSE_ATIVO === "true";
}

function aliquota(nome: string): number {
  const v = Number(process.env[nome] ?? 0);
  return Number.isFinite(v) ? v : 0;
}

/** Data de hoje em Brasília (YYYY-MM-DD). */
function hojeEmBrasilia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export async function emitirNotaDoPagamento(
  dbPaymentId: string,
  asaasPayment: { id: string; customer?: string; installment?: string | null },
): Promise<void> {
  if (!nfseAtiva()) return;

  const pagamento = await prisma.payment.findUnique({
    where: { id: dbPaymentId },
    select: {
      id: true,
      amount: true,
      nfseId: true,
      enrollmentId: true,
      enrollment: { select: { course: { select: { title: true } }, user: { select: { name: true, email: true } } } },
    },
  });
  if (!pagamento || pagamento.nfseId) return;

  const curso = pagamento.enrollment.course.title;
  const aluno = pagamento.enrollment.user.name ?? pagamento.enrollment.user.email;
  const parcelado = !!asaasPayment.installment;

  try {
    if (parcelado && !asaasPayment.customer) throw new Error("webhook sem o cliente do parcelamento");

    const nota = await createInvoice({
      ...(parcelado ? { customer: asaasPayment.customer } : { payment: asaasPayment.id }),
      externalReference: pagamento.enrollmentId,
      serviceDescription: (process.env.ASAAS_NFSE_DESCRICAO ?? "Instrução e treinamento – curso de aperfeiçoamento médico").replace("{curso}", curso),
      observations: `Curso ${curso}, NU.V.E.M Ensino.`,
      value: Number(pagamento.amount),
      effectiveDate: hojeEmBrasilia(),
      municipalServiceCode: process.env.ASAAS_NFSE_CODIGO_SERVICO ?? "08.02.01.001",
      municipalServiceName:
        process.env.ASAAS_NFSE_NOME_SERVICO ?? "Instrução e treinamento, avaliação de conhecimentos de quaisquer natureza",
      taxes: {
        retainIss: false,
        iss: aliquota("ASAAS_NFSE_ISS"),
        pis: 0,
        cofins: 0,
        csll: 0,
        inss: 0,
        ir: 0,
        nbsCode: process.env.ASAAS_NFSE_NBS ?? "1.2205.19.00",
      },
    });

    await prisma.payment.update({
      where: { id: pagamento.id },
      data: { nfseId: nota.id, nfseStatus: nota.status },
    });
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.error("[nfse] falha ao pedir a nota:", motivo);
    await prisma.payment.update({ where: { id: pagamento.id }, data: { nfseStatus: "ERROR" } }).catch(() => {});
    await sendAlertaNotaFiscal({ aluno, curso, paymentId: pagamento.id, motivo });
  }
}

type InvoiceDoWebhook = {
  id: string;
  status?: string;
  number?: string | null;
  pdfUrl?: string | null;
  statusDescription?: string | null;
};

/** Atualiza a nota a partir dos webhooks INVOICE_* e avisa a coordenação quando der erro. */
export async function atualizarNotaPeloWebhook(event: string, invoice: InvoiceDoWebhook): Promise<void> {
  const pagamento = await prisma.payment.findFirst({
    where: { nfseId: invoice.id },
    select: { id: true, enrollment: { select: { course: { select: { title: true } }, user: { select: { name: true, email: true } } } } },
  });
  if (!pagamento) return;

  await prisma.payment.update({
    where: { id: pagamento.id },
    data: {
      nfseStatus: invoice.status ?? event.replace("INVOICE_", ""),
      ...(invoice.number ? { nfseNumber: String(invoice.number) } : {}),
      ...(invoice.pdfUrl ? { nfsePdfUrl: invoice.pdfUrl } : {}),
    },
  });

  if (event === "INVOICE_ERROR" || event === "INVOICE_CANCELLATION_DENIED") {
    await sendAlertaNotaFiscal({
      aluno: pagamento.enrollment.user.name ?? pagamento.enrollment.user.email,
      curso: pagamento.enrollment.course.title,
      paymentId: pagamento.id,
      motivo:
        (event === "INVOICE_CANCELLATION_DENIED" ? "Cancelamento recusado. " : "") +
        (invoice.statusDescription ?? "O Asaas não informou o motivo."),
    });
  }
}

/** Reembolso: pede o cancelamento da nota, se houver uma. */
export async function cancelarNotaDoPagamento(dbPaymentId: string): Promise<void> {
  if (!nfseAtiva()) return;
  const pagamento = await prisma.payment.findUnique({
    where: { id: dbPaymentId },
    select: { id: true, nfseId: true, nfseStatus: true, enrollment: { select: { course: { select: { title: true } }, user: { select: { name: true, email: true } } } } },
  });
  if (!pagamento?.nfseId || pagamento.nfseStatus === "CANCELED") return;

  try {
    await cancelInvoice(pagamento.nfseId);
  } catch (err) {
    await sendAlertaNotaFiscal({
      aluno: pagamento.enrollment.user.name ?? pagamento.enrollment.user.email,
      curso: pagamento.enrollment.course.title,
      paymentId: pagamento.id,
      motivo: `Reembolso feito, mas a nota não foi cancelada: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
