import { Resend } from "resend";
import { APP_URL } from "@/lib/appUrl";
import { prisma } from "@/lib/prisma";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
}
const FROM = process.env.EMAIL_FROM ?? "NU.V.E.M ENSINO <cursos@nuvemensino.com.br>";

export type DeliveryResult =
  | { ok: true; id: string | undefined }
  | { ok: false; error: string };

/**
 * Grava o resultado do envio na tabela EmailLog.
 *
 * Best-effort de propósito: se o registro falhar, o envio em si não pode ser
 * afetado — o log existe para diagnóstico, não para bloquear o aluno.
 */
async function registrar(
  kind: string,
  to: string,
  result: DeliveryResult,
): Promise<void> {
  try {
    await prisma.emailLog.create({
      data: {
        kind,
        recipient: to,
        status: result.ok ? "SENT" : "FAILED",
        providerId: result.ok ? (result.id ?? null) : null,
        error: result.ok ? null : result.error,
      },
    });
  } catch (e) {
    console.error(`[email] falha ao gravar EmailLog de ${kind} → ${to}:`, e);
  }
}

/**
 * Envia pela Resend registrando o resultado.
 *
 * O SDK da Resend NÃO lança erro quando a API recusa a mensagem: ele resolve
 * com `{ error }`. Sem esta checagem, uma chave inválida, um domínio não
 * verificado ou um destinatário bloqueado passavam despercebidos — o envio
 * "dava certo" no código e o e-mail simplesmente nunca chegava.
 *
 * Todo resultado — sucesso ou falha — vai para a tabela EmailLog, consultável
 * em /admin/emails.
 */
async function deliver(
  kind: string,
  to: string,
  payload: { from: string; to: string; subject: string; html: string },
): Promise<DeliveryResult> {
  const finalizar = async (result: DeliveryResult): Promise<DeliveryResult> => {
    await registrar(kind, to, result);
    return result;
  };

  if (!process.env.RESEND_API_KEY) {
    console.error(`[email] ${kind} → ${to}: NÃO ENVIADO — RESEND_API_KEY não configurada`);
    return finalizar({ ok: false, error: "RESEND_API_KEY não configurada" });
  }

  try {
    const { data, error } = await getResend().emails.send(payload);
    if (error) {
      console.error(`[email] ${kind} → ${to}: RECUSADO pela Resend — ${error.name}: ${error.message}`);
      return finalizar({ ok: false, error: `${error.name}: ${error.message}` });
    }
    console.info(`[email] ${kind} → ${to}: aceito pela Resend (id ${data?.id ?? "?"})`);
    return finalizar({ ok: true, id: data?.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[email] ${kind} → ${to}: FALHOU — ${msg}`);
    return finalizar({ ok: false, error: msg });
  }
}

function baseLayout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#00475e;padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#cbe4e6;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">NU.V.E.M ENSINO</p>
          <p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:300;font-family:Georgia,serif;">${title}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f4f7f6;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">NU.V.E.M ENSINO · cursos@nuvemensino.com.br · (31) 7229-1029</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:11px;">Belo Horizonte, MG</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEnrollmentConfirmation({
  to,
  userName,
  courseName,
  courseSlug,
}: {
  to: string;
  userName: string;
  courseName: string;
  courseSlug: string;
}) {
  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Sua matrícula foi confirmada com sucesso. Boas-vindas ao curso:</p>
    <div style="background:#f0f9fa;border-left:4px solid #00475e;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;color:#00475e;font-size:16px;font-weight:600;font-family:Georgia,serif;">${courseName}</p>
    </div>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Acesse sua área do aluno para começar o curso imediatamente.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${APP_URL}/dashboard/cursos/${courseSlug}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Acessar o curso
      </a>
    </div>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Dúvidas? Responda este e-mail ou fale pelo WhatsApp <a href="https://wa.me/5531972291029" style="color:#00475e;">(31) 7229-1029</a>.</p>
  `;

  return deliver("matrícula confirmada", to, {
    from: FROM,
    to,
    subject: `Matrícula confirmada: ${courseName}`,
    html: baseLayout("Matrícula Confirmada", body),
  });
}

export async function sendPaymentPendingEmail({
  to,
  userName,
  courseName,
  method,
  checkoutUrl,
}: {
  to: string;
  userName: string;
  courseName: string;
  method: "pix" | "boleto" | "parcelado" | string;
  checkoutUrl: string;
}) {
  const methodLabel =
    method === "pix" ? "PIX" : method === "boleto" ? "Boleto Bancário" : "Cartão de Crédito";

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Identificamos que você iniciou a inscrição no curso abaixo, mas o pagamento ainda não foi confirmado:</p>
    <div style="background:#f0f9fa;border-left:4px solid #00475e;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;color:#00475e;font-size:16px;font-weight:600;font-family:Georgia,serif;">${courseName}</p>
      <p style="margin:6px 0 0;color:#6b7280;font-size:13px;">Forma de pagamento: <strong>${methodLabel}</strong></p>
    </div>
    <p style="margin:0 0 8px;color:#374151;font-size:15px;">Se teve alguma dificuldade, é simples de resolver:</p>
    <ul style="margin:0 0 24px;padding-left:20px;color:#6b7280;font-size:14px;line-height:1.8;">
      <li>Verifique se os dados do pagamento estão corretos</li>
      <li>Tente novamente pelo link abaixo</li>
      <li>Se o problema persistir, entre em contato pelo WhatsApp</li>
    </ul>
    <div style="text-align:center;margin:32px 0;">
      <a href="${checkoutUrl}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Tentar novamente →
      </a>
    </div>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Precisa de ajuda? Fale conosco pelo WhatsApp <a href="https://wa.me/5531972291029" style="color:#00475e;">(31) 7229-1029</a> — respondemos rapidamente.</p>
  `;

  return deliver("pagamento pendente", to, {
    from: FROM,
    to,
    subject: `Sua inscrição em ${courseName} está aguardando pagamento`,
    html: baseLayout("Pagamento Pendente", body),
  });
}

export async function sendPasswordResetEmail({
  to,
  userName,
  token,
  expiresLabel = "24 horas",
}: {
  to: string;
  userName: string;
  token: string;
  /** Precisa acompanhar a validade real do token. */
  expiresLabel?: string;
}) {
  const link = `${APP_URL}/resetar-senha?token=${token}`;

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Recebemos uma solicitação para redefinir a senha da sua conta NU.V.E.M ENSINO.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${link}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Redefinir minha senha
      </a>
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">⏱ Este link expira em <strong>${expiresLabel}</strong>.</p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">Se você não solicitou a redefinição de senha, ignore este e-mail — sua conta permanece segura.</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Ou copie e cole este endereço no navegador:<br/><span style="color:#00475e;word-break:break-all;">${link}</span></p>
  `;

  return deliver("redefinição de senha", to, {
    from: FROM,
    to,
    subject: "Redefina sua senha — NU.V.E.M ENSINO",
    html: baseLayout("Redefinição de Senha", body),
  });
}

export async function sendSetPasswordEmail({
  to,
  userName,
  courseName,
  token,
  expiresLabel = "1 hora",
}: {
  to: string;
  userName: string;
  courseName: string;
  token: string;
  /** Precisa acompanhar a validade real do token — o reenvio pelo admin usa 7 dias. */
  expiresLabel?: string;
}) {
  const link = `${APP_URL}/resetar-senha?token=${token}`;

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Sua matrícula em <strong>${courseName}</strong> foi recebida. Falta só um passo: crie uma senha para acessar sua área do aluno.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${link}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Criar minha senha
      </a>
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">⏱ Este link expira em <strong>${expiresLabel}</strong>. Se expirar, use "Esqueci minha senha" na tela de login com o e-mail ${to}.</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Ou copie e cole este endereço no navegador:<br/><span style="color:#00475e;word-break:break-all;">${link}</span></p>
  `;

  return deliver("criar senha (pós-compra)", to, {
    from: FROM,
    to,
    subject: `Crie sua senha de acesso — ${courseName}`,
    html: baseLayout("Bem-vindo(a)!", body),
  });
}

export async function sendEmailVerificationEmail({
  to,
  userName,
  token,
}: {
  to: string;
  userName: string;
  token: string;
}) {
  const link = `${APP_URL}/verificar-email?token=${token}`;

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Bem-vindo(a) à NU.V.E.M ENSINO! Confirme seu endereço de e-mail para ativar sua conta.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${link}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Confirmar meu e-mail
      </a>
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">⏱ Este link expira em <strong>24 horas</strong>.</p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">Se você não criou uma conta na NU.V.E.M ENSINO, ignore este e-mail.</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Ou copie e cole este endereço no navegador:<br/><span style="color:#00475e;word-break:break-all;">${link}</span></p>
  `;

  return deliver("confirmação de e-mail", to, {
    from: FROM,
    to,
    subject: "Confirme seu e-mail — NU.V.E.M ENSINO",
    html: baseLayout("Confirmação de E-mail", body),
  });
}

export async function sendLiveSessionReminder({
  to,
  userName,
  courseName,
  sessionTitle,
  startAt,
  meetUrl,
  location,
  hoursAhead,
}: {
  to: string;
  userName: string;
  courseName: string;
  sessionTitle: string;
  startAt: Date;
  meetUrl?: string | null;
  location?: string | null;
  hoursAhead: 24 | 1;
}) {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(startAt);

  const timeLabel = hoursAhead === 24 ? "amanhã" : "em 1 hora";
  const subject = hoursAhead === 24
    ? `Lembrete: sua aula ao vivo começa amanhã`
    : `Sua aula ao vivo começa em 1 hora!`;

  const accessBlock = meetUrl
    ? `<div style="text-align:center;margin:32px 0;">
        <a href="${meetUrl}" style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
          Entrar no Google Meet
        </a>
       </div>`
    : location
    ? `<div style="background:#f0f9fa;border-radius:8px;padding:16px 20px;margin:24px 0;text-align:center;">
        <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Local</p>
        <p style="margin:4px 0 0;color:#00475e;font-size:15px;font-weight:600;">${location}</p>
       </div>`
    : "";

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Sua aula ao vivo começa <strong>${timeLabel}</strong>:</p>
    <div style="background:#f0f9fa;border-left:4px solid #00475e;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">${courseName}</p>
      <p style="margin:4px 0 8px;color:#00475e;font-size:16px;font-weight:600;font-family:Georgia,serif;">${sessionTitle}</p>
      <p style="margin:0;color:#374151;font-size:14px;">📅 ${formattedDate}</p>
    </div>
    ${accessBlock}
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Dúvidas? Entre em contato pelo WhatsApp <a href="https://wa.me/5531972291029" style="color:#00475e;">(31) 7229-1029</a>.</p>
  `;

  return deliver("lembrete de aula ao vivo", to, {
    from: FROM,
    to,
    subject,
    html: baseLayout(subject, body),
  });
}

/**
 * Convite e lembrete de um encontro síncrono, enviados à mão pela coordenação.
 *
 * Existe separado de sendLiveSessionReminder porque aquele é disparado pelo cron
 * com texto genérico; este carrega a pauta do encontro e é escrito para uma data
 * específica. Texto aprovado pela coordenação — não altere sem nova aprovação.
 *
 * `tipo`:
 *   "aviso"    → véspera, com data, horário e pauta
 *   "lembrete" → manhã do dia, curto, só o link
 */
export async function sendEncontroSincrono({
  to,
  userName,
  tipo,
  courseName,
  sessionTitle,
  dateLabel,
  timeLabel,
  pauta,
  meetUrl,
}: {
  to: string;
  userName: string;
  tipo: "aviso" | "lembrete";
  courseName: string;
  sessionTitle: string;
  dateLabel: string;
  timeLabel: string;
  pauta: string;
  meetUrl: string;
}) {
  const botao = `
    <div style="text-align:center;margin:32px 0;">
      <a href="${meetUrl}" style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Entrar no Google Meet
      </a>
    </div>`;

  const rodapeWhats = (prefixo: string) => `
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">
      ${prefixo}
      <a href="https://wa.me/5531972291029" style="color:#00475e;">(31) 7229-1029</a>.
    </p>`;

  const assinatura = (despedida: string) => `
    <p style="margin:28px 0 0;color:#374151;font-size:15px;">${despedida}</p>
    <p style="margin:16px 0 0;color:#00475e;font-size:14px;font-weight:700;letter-spacing:0.12em;">NU.V.E.M ENSINO</p>`;

  const title = tipo === "aviso" ? sessionTitle : "É hoje!";
  const subject =
    tipo === "aviso"
      ? `Amanhã, ${timeLabel}: nosso ${sessionTitle}`
      : `Hoje às ${timeLabel}: link do ${sessionTitle}`;

  const body =
    tipo === "aviso"
      ? `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      Amanhã acontece o nosso <strong>${sessionTitle}</strong>, o primeiro momento em que vamos nos reunir ao vivo para discutir o conteúdo e tirar dúvidas.
    </p>
    <div style="background:#f0f9fa;border-left:4px solid #00475e;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">${courseName}</p>
      <p style="margin:4px 0 10px;color:#00475e;font-size:16px;font-weight:600;font-family:Georgia,serif;">${sessionTitle}</p>
      <p style="margin:0 0 4px;color:#374151;font-size:14px;">📅 ${dateLabel}</p>
      <p style="margin:0 0 4px;color:#374151;font-size:14px;">🕢 ${timeLabel} às 21h30 <span style="color:#9ca3af;">(horário de Brasília)</span></p>
      <p style="margin:0;color:#374151;font-size:14px;">💻 Google Meet</p>
    </div>
    ${botao}
    <p style="margin:0 0 12px;color:#00475e;font-size:14px;font-weight:700;">O que vamos discutir</p>
    <p style="margin:0 0 20px;color:#374151;font-size:15px;"><strong>${pauta}</strong></p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      Fechamos com <strong>discussão de casos clínicos</strong>, a parte que só existe ao vivo. Traga suas dúvidas: reservamos um bloco final para perguntas.
    </p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">
      O encontro será gravado e disponibilizado na plataforma, mas é ao vivo que a discussão de casos acontece de verdade.
    </p>
    ${assinatura("Até amanhã!")}
    ${rodapeWhats("Dúvidas? Responda este e-mail ou fale pelo WhatsApp")}
  `
      : `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      Passando só para lembrar: nosso <strong>${sessionTitle}</strong> é <strong>hoje às ${timeLabel}</strong> (horário de Brasília), pelo Google Meet.
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;">
      Vamos discutir o <strong>${pauta.replace(/\.$/, "")}</strong> e fechar com casos clínicos.
    </p>
    ${botao}
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">Sugestão: entre 5 minutinhos antes para testar áudio e câmera.</p>
    ${assinatura("Esperamos você lá!")}
    ${rodapeWhats("Dúvidas? Fale pelo WhatsApp")}
  `;

  return deliver(`encontro síncrono (${tipo})`, to, {
    from: FROM,
    to,
    subject,
    html: baseLayout(title, body),
  });
}

/**
 * Reengajamento de quem começou a inscrição e não concluiu o pagamento.
 *
 * O texto assume que a turma já começou: omitir isso geraria frustração na
 * primeira aula. As aulas são gravadas, então entrar depois é viável — é esse
 * o argumento, não a pressa.
 */
export async function sendCupomReengajamento({
  to,
  userName,
  courseName,
  courseSlug,
  cupom,
  precoDe,
  precoPor,
}: {
  to: string;
  userName: string;
  courseName: string;
  courseSlug: string;
  cupom: string;
  precoDe: string;
  precoPor: string;
}) {
  const link = `${APP_URL}/cursos/${courseSlug}`;

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Vimos que você chegou a iniciar a inscrição no <strong>${courseName}</strong>, mas o pagamento não foi concluído. Sua vaga continua disponível.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">A turma já está em andamento, e isso não é um problema: <strong>todas as aulas ficam gravadas</strong> na plataforma. Você assiste no seu ritmo e acompanha os encontros síncronos a partir do próximo.</p>
    <div style="background:#f0f7f8;border:1px solid #cbe4e6;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 6px;color:#00475e;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Cupom de 20% para você</p>
      <p style="margin:0 0 10px;color:#00475e;font-size:26px;font-weight:700;letter-spacing:0.06em;">${cupom}</p>
      <p style="margin:0;color:#6b7280;font-size:14px;"><s>${precoDe}</s> &nbsp;→&nbsp; <strong style="color:#00475e;font-size:18px;">${precoPor}</strong></p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Garantir minha vaga
      </a>
    </div>
    <p style="margin:0;color:#6b7280;font-size:13px;">É só aplicar o cupom <strong>${cupom}</strong> na hora do pagamento. Qualquer dúvida, responda este e-mail que a gente ajuda.</p>
  `;

  return deliver("reengajamento com cupom", to, {
    from: FROM,
    to,
    subject: `Sua vaga no ${courseName.split(":")[0]} continua disponível — 20% de desconto`,
    html: baseLayout("Sua vaga ainda está aberta", body),
  });
}

/**
 * Lembrete para o aluno matriculado que ainda não abriu nenhuma aula.
 *
 * Não cobra nem culpa: a maioria simplesmente não teve tempo ainda. O objetivo
 * é lembrar que o material está lá e que dá para começar por onde quiser.
 */
export async function sendLembreteAulas({
  to,
  userName,
  courseName,
  courseSlug,
}: {
  to: string;
  userName: string;
  courseName: string;
  courseSlug: string;
}) {
  const link = `${APP_URL}/dashboard/cursos/${courseSlug}`;

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Sua matrícula no <strong>${courseName}</strong> está ativa, e as aulas já estão liberadas na plataforma — mas notamos que você ainda não começou.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Não há pressa nem prazo apertado: <strong>as aulas são gravadas</strong> e ficam disponíveis para você assistir quando puder, na ordem que preferir. Dá para começar por 15 minutos hoje.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Começar a assistir
      </a>
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Se estiver com dificuldade para entrar na plataforma, responda este e-mail: a gente resolve rápido.</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Ou copie e cole este endereço no navegador:<br/><span style="color:#00475e;word-break:break-all;">${link}</span></p>
  `;

  return deliver("lembrete de aulas", to, {
    from: FROM,
    to,
    subject: `Suas aulas do ${courseName.split(":")[0]} estão esperando`,
    html: baseLayout("Suas aulas estão liberadas", body),
  });
}
