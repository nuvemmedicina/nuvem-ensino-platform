import { Resend } from "resend";
import { APP_URL } from "@/lib/appUrl";
import { prisma } from "@/lib/prisma";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
}
const FROM = process.env.EMAIL_FROM ?? "NU.V.E.M Ensino <cursos@nuvemensino.com.br>";
const GRUPO_WHATSAPP_DICI = "https://chat.whatsapp.com/Bu30QwD28QP2FJbYW8wMdp";

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
          <p style="margin:0;color:#cbe4e6;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">NU.V.E.M Ensino</p>
          <p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:300;font-family:Georgia,serif;">${title}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f4f7f6;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">NU.V.E.M Ensino · cursos@nuvemensino.com.br · (31) 97229-1029</p>
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
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Dúvidas? Responda este e-mail ou fale pelo WhatsApp <a href="https://wa.me/5531972291029" style="color:#00475e;">(31) 97229-1029</a>.</p>
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
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Precisa de ajuda? Fale conosco pelo WhatsApp <a href="https://wa.me/5531972291029" style="color:#00475e;">(31) 97229-1029</a> — respondemos rapidamente.</p>
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
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Recebemos uma solicitação para redefinir a senha da sua conta NU.V.E.M Ensino.</p>
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
    subject: "Redefina sua senha — NU.V.E.M Ensino",
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
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Bem-vindo(a) à NU.V.E.M Ensino! Confirme seu endereço de e-mail para ativar sua conta.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${link}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Confirmar meu e-mail
      </a>
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">⏱ Este link expira em <strong>24 horas</strong>.</p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">Se você não criou uma conta na NU.V.E.M Ensino, ignore este e-mail.</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Ou copie e cole este endereço no navegador:<br/><span style="color:#00475e;word-break:break-all;">${link}</span></p>
  `;

  return deliver("confirmação de e-mail", to, {
    from: FROM,
    to,
    subject: "Confirme seu e-mail — NU.V.E.M Ensino",
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
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Dúvidas? Entre em contato pelo WhatsApp <a href="https://wa.me/5531972291029" style="color:#00475e;">(31) 97229-1029</a>.</p>
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
 *
 * `quandoLabel`/`despedida` trocam o "Amanhã"/"Até amanhã!" do aviso quando ele
 * sai com mais de um dia de antecedência (ex.: "Nesta quarta-feira"/"Até quarta!").
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
  quandoLabel = "Amanhã",
  despedida = "Até amanhã!",
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
  quandoLabel?: string;
  despedida?: string;
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
      <a href="https://wa.me/5531972291029" style="color:#00475e;">(31) 97229-1029</a>.
    </p>`;

  const assinatura = (despedida: string) => `
    <p style="margin:28px 0 0;color:#374151;font-size:15px;">${despedida}</p>
    <p style="margin:16px 0 0;color:#00475e;font-size:14px;font-weight:700;letter-spacing:0.12em;">NU.V.E.M Ensino</p>`;

  const title = tipo === "aviso" ? sessionTitle : "É hoje!";
  const subject =
    tipo === "aviso"
      ? `${quandoLabel}, ${timeLabel}: nosso ${sessionTitle}`
      : `Hoje às ${timeLabel}: link do ${sessionTitle}`;

  const body =
    tipo === "aviso"
      ? `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      ${quandoLabel} acontece o nosso <strong>${sessionTitle}</strong>: mais um momento para nos reunirmos ao vivo, discutir o conteúdo e tirar dúvidas.
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
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">
      O encontro será gravado e disponibilizado na plataforma, mas é ao vivo que a discussão de casos acontece de verdade.
    </p>
    ${assinatura(despedida)}
    ${rodapeWhats("Dúvidas? Responda este e-mail ou fale pelo WhatsApp")}
  `
      : `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      Passando só para lembrar: nosso <strong>${sessionTitle}</strong> é <strong>hoje às ${timeLabel}</strong> (horário de Brasília), pelo Google Meet.
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;">
      Vamos discutir o <strong>${pauta.replace(/\.$/, "")}</strong>.
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
 * Enviado na hora em que a pessoa se inscreve na aula gratuita (/aula-gratuita).
 *
 * Leva o link de volta para a aula — que funciona em qualquer aparelho, sem
 * precisar se inscrever de novo — e o cupom de desconto para a matrícula.
 */
export async function sendAulaGratuita({
  to,
  nome,
  titulo,
  linkAula,
  linkMatricula,
  cupom,
  descontoPct,
  precoDe,
  precoPor,
}: {
  to: string;
  nome: string;
  titulo: string;
  linkAula: string;
  linkMatricula: string;
  cupom: string;
  descontoPct: number;
  precoDe: string;
  precoPor: string;
}) {
  const primeiroNome = nome.trim().split(/\s+/)[0];

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${primeiroNome}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Sua aula está liberada. É a gravação completa do encontro <strong>“${titulo}”</strong>, do Curso de Aperfeiçoamento em DICI, com a Dra. Vera Ângelo.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${linkAula}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Assistir à aula
      </a>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Este link é seu: abre a aula em qualquer aparelho, sem precisar se cadastrar de novo.</p>
    <div style="background:#f0f7f8;border:1px solid #cbe4e6;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 6px;color:#00475e;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">${descontoPct}% de desconto no curso completo</p>
      <p style="margin:0 0 10px;color:#00475e;font-size:26px;font-weight:700;letter-spacing:0.06em;">${cupom}</p>
      <p style="margin:0 0 14px;color:#6b7280;font-size:14px;"><s>${precoDe}</s> &nbsp;→&nbsp; <strong style="color:#00475e;font-size:18px;">${precoPor}</strong></p>
      <a href="${linkMatricula}" style="color:#00475e;font-size:14px;font-weight:600;">Matricular com o desconto →</a>
    </div>
    <p style="margin:0;color:#6b7280;font-size:13px;">Ficou alguma dúvida sobre o curso? É só responder este e-mail.</p>
  `;

  return deliver("aula gratuita", to, {
    from: FROM,
    to,
    subject: `Sua aula está liberada: ${titulo}`,
    html: baseLayout("Sua aula está liberada", body),
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

/**
 * Segundo lembrete para quem já recebeu sendLembreteAulas e continua sem
 * assistir nada. Reconhece que não é a primeira mensagem e é mais direto:
 * cita o que já está liberado esperando, em vez de repetir o texto genérico.
 */
export async function sendSegundoLembreteAulas({
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
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Te escrevemos há alguns dias sobre o <strong>${courseName}</strong> e vimos que ainda não deu tempo de começar. Sem cobrança nenhuma — só não queríamos que sua vaga ficasse esquecida.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;"><strong>Dois módulos já estão liberados</strong> esperando por você, e um terceiro chega em outubro. Quanto mais cedo começar, mais fôlego você tem para acompanhar no seu ritmo.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Ver minhas aulas agora
      </a>
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Se o que está faltando é tempo de agenda, comece pela primeira aula: costuma levar menos de 15 minutos.</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">Se for dificuldade para entrar na plataforma, responda este e-mail ou chame no WhatsApp: a gente resolve rápido.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;">Entre também no <a href="${GRUPO_WHATSAPP_DICI}" style="color:#00475e;font-weight:600;">grupo do WhatsApp da turma</a> para lembretes e trocar com os colegas.</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Ou copie e cole este endereço no navegador:<br/><span style="color:#00475e;word-break:break-all;">${link}</span></p>
  `;

  return deliver("segundo lembrete de aulas", to, {
    from: FROM,
    to,
    subject: `${userName.split(" ")[0]}, sua vaga no ${courseName.split(":")[0]} está parada`,
    html: baseLayout("Ainda dá tempo de começar", body),
  });
}

/**
 * Terceiro contato (01/10/2026) com quem continua sem nenhuma aula concluída
 * depois dos lembretes de 31/08 e 11/09. Tom de apoio, sem cobrança, e o
 * caminho de ajuda bem visível — a essa altura o motivo costuma ser acesso.
 */
export async function sendTerceiroLembreteAulas({
  to,
  userName,
  courseName,
  courseSlug,
  aulasLiberadas,
}: {
  to: string;
  userName: string;
  courseName: string;
  courseSlug: string;
  aulasLiberadas: number;
}) {
  const link = `${APP_URL}/dashboard/cursos/${courseSlug}`;
  const entrar = `${APP_URL}/entrar`;

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Sua matrícula no <strong>${courseName}</strong> está ativa, e o curso inteiro já está à sua espera: <strong>os quatro módulos e os Módulos Bônus "Como Eu Faço" estão liberados</strong>, com ${aulasLiberadas} aulas gravadas, e os encontros ao vivo também ficaram gravados na plataforma.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Nada está perdido. Você assiste no seu ritmo, na ordem que preferir, e ao concluir o curso recebe o seu certificado.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Começar minha primeira aula
      </a>
    </div>
    <div style="background:#f0f9fa;border-left:4px solid #00475e;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;color:#00475e;font-size:14px;font-weight:700;">Não está conseguindo entrar?</p>
      <p style="margin:0;color:#374151;font-size:14px;">Na <a href="${entrar}" style="color:#00475e;font-weight:600;">tela de login</a>, use "Esqueci minha senha" com o e-mail <strong>${to}</strong> e crie uma senha nova em um minuto. Se mesmo assim não der certo, responda este e-mail ou chame no WhatsApp que resolvemos com você.</p>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;">Entre também no <a href="${GRUPO_WHATSAPP_DICI}" style="color:#00475e;font-weight:600;">grupo do WhatsApp da turma</a> para receber os avisos e trocar com os colegas.</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Ou copie e cole este endereço no navegador:<br/><span style="color:#00475e;word-break:break-all;">${link}</span></p>
  `;

  return deliver("terceiro lembrete de aulas", to, {
    from: FROM,
    to,
    subject: `${userName.split(" ")[0]}, suas aulas do ${courseName.split(":")[0]} estão esperando por você`,
    html: baseLayout("Sua turma está te esperando", body),
  });
}

/**
 * Convite para retomar (01/10/2026): quem concluiu ao menos uma aula do DICI,
 * mas não registra atividade desde agosto. Diferente do lembrete de quem nunca
 * começou, parte do que o aluno já fez — `aulasConcluidas` aparece no texto.
 */
export async function sendRetomarAulas({
  to,
  userName,
  courseName,
  courseSlug,
  aulasConcluidas,
  aulasLiberadas,
}: {
  to: string;
  userName: string;
  courseName: string;
  courseSlug: string;
  aulasConcluidas: number;
  aulasLiberadas: number;
}) {
  const link = `${APP_URL}/dashboard/cursos/${courseSlug}`;
  const feitas = aulasConcluidas === 1 ? "1 aula" : `${aulasConcluidas} aulas`;

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Você já concluiu <strong>${feitas}</strong> do <strong>${courseName}</strong>, e seu progresso está guardado: é só voltar e continuar de onde parou.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">A turma avançou: <strong>os quatro módulos já estão liberados</strong>, junto com os Módulos Bônus "Como Eu Faço", somando ${aulasLiberadas} aulas gravadas. Os encontros ao vivo também ficaram gravados na plataforma, e cada módulo tem a sua prova. É um ótimo momento para colocar as aulas em dia.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Continuar de onde parei
      </a>
    </div>
    <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">Se tiver alguma dificuldade para entrar ou assistir, responda este e-mail ou chame no WhatsApp: a gente resolve rápido.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;">Entre também no <a href="${GRUPO_WHATSAPP_DICI}" style="color:#00475e;font-weight:600;">grupo do WhatsApp da turma</a> para receber os avisos e trocar com os colegas.</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Ou copie e cole este endereço no navegador:<br/><span style="color:#00475e;word-break:break-all;">${link}</span></p>
  `;

  return deliver("retomar aulas", to, {
    from: FROM,
    to,
    subject: `${userName.split(" ")[0]}, continue de onde parou no ${courseName.split(":")[0]}`,
    html: baseLayout("Seu progresso está guardado", body),
  });
}

/**
 * Aviso de liberação de um novo módulo — vai para toda a turma matriculada,
 * o que inclui os professores (eles também são matriculados no curso).
 */
export async function sendModuloLiberado({
  to,
  userName,
  courseName,
  courseSlug,
  moduloTitle,
  destaques,
}: {
  to: string;
  userName: string;
  courseName: string;
  courseSlug: string;
  moduloTitle: string;
  /** Alguns temas do módulo, para dar um gostinho do conteúdo. */
  destaques: string[];
}) {
  const link = `${APP_URL}/dashboard/cursos/${courseSlug}`;

  const listaDestaques = destaques
    .map((d) => `<li style="margin:0 0 6px;">${d}</li>`)
    .join("");

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${userName}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Um novo módulo do <strong>${courseName}</strong> já está disponível na plataforma:</p>
    <div style="background:#f0f9fa;border-left:4px solid #00475e;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;color:#00475e;font-size:16px;font-weight:600;font-family:Georgia,serif;">${moduloTitle}</p>
    </div>
    <p style="margin:0 0 8px;color:#374151;font-size:15px;">Alguns dos temas que você vai encontrar:</p>
    <ul style="margin:0 0 24px;padding-left:20px;color:#6b7280;font-size:14px;line-height:1.7;">
      ${listaDestaques}
    </ul>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;">Aulas gravadas, prova e flashcards do módulo já estão liberados — é só acessar.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${link}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Acessar o módulo
      </a>
    </div>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Dúvidas? Responda este e-mail ou fale pelo WhatsApp <a href="https://wa.me/5531972291029" style="color:#00475e;">(31) 97229-1029</a>.</p>
  `;

  return deliver("módulo liberado", to, {
    from: FROM,
    to,
    subject: `Novo módulo liberado: ${moduloTitle}`,
    html: baseLayout("Novo módulo liberado", body),
  });
}

/**
 * Pede ao aluno os dados que a FACOP exige para emitir o certificado. A
 * coordenação dispara em lotes por /admin/certificados-facop.
 */
export async function sendPedidoDadosCertificado({
  to,
  userName,
  courseName,
}: {
  to: string;
  userName: string;
  courseName: string;
}) {
  const primeiroNome = userName.trim().split(/\s+/)[0] || "aluno(a)";
  const link = `${APP_URL}/dashboard/dados-certificado`;

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${primeiroNome}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Você está na reta final do <strong>${courseName}</strong>. Para a Faculdade FACOP emitir o seu certificado, precisamos de alguns dados que ainda não temos no seu cadastro.</p>
    <div style="background:#f0f9fa;border-left:4px solid #00475e;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 10px;color:#00475e;font-size:14px;font-weight:700;">O que vamos pedir</p>
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">• Nome completo, como deve sair no certificado</p>
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">• CPF</p>
      <p style="margin:0;color:#374151;font-size:14px;">• Telefone e endereço completo</p>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Leva só um minuto. É só entrar com o seu login, conferir e preencher.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Preencher meus dados
      </a>
    </div>
    <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">Os dados são usados só para o certificado e ficam guardados no seu cadastro da plataforma.</p>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Dúvidas? Responda este e-mail ou fale pelo WhatsApp <a href="https://wa.me/5531972291029" style="color:#00475e;">(31) 97229-1029</a>.</p>
  `;

  return deliver("dados do certificado", to, {
    from: FROM,
    to,
    subject: "Seu certificado: precisamos de alguns dados",
    html: baseLayout("Dados para o seu certificado", body),
  });
}

/** Aviso interno para a coordenação: a nota fiscal de uma venda não saiu (ver lib/nfse.ts). */
export async function sendAlertaNotaFiscal({
  aluno,
  curso,
  paymentId,
  motivo,
}: {
  aluno: string;
  curso: string;
  paymentId: string;
  motivo: string;
}) {
  const to = process.env.NFSE_ALERTA_EMAIL ?? "cursos@nuvemensino.com.br";
  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">A nota fiscal desta venda <strong>não foi emitida</strong> pelo Asaas:</p>
    <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;color:#374151;font-size:14px;">Aluno(a): <strong>${aluno}</strong></p>
      <p style="margin:6px 0 0;color:#374151;font-size:14px;">Curso: <strong>${curso}</strong></p>
      <p style="margin:6px 0 0;color:#374151;font-size:14px;">Motivo: ${motivo}</p>
      <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;">Pagamento na plataforma: ${paymentId}</p>
    </div>
    <p style="margin:0;color:#6b7280;font-size:14px;">Confira no painel do Asaas, em Notas Fiscais. Muitas vezes falta o endereço completo com CEP no cadastro do cliente. Depois de corrigir, a nota pode ser emitida por lá.</p>
  `;

  return deliver("alerta de nota fiscal", to, {
    from: FROM,
    to,
    subject: `Nota fiscal não emitida: ${aluno} (${curso})`,
    html: baseLayout("Nota fiscal não emitida", body),
  });
}

/**
 * Aviso geral de que a declaração de matrícula pode ser baixada pela área do
 * aluno, sem pedir à coordenação. Quem precisa de nota fiscal responde o e-mail.
 */
export async function sendAvisoDeclaracaoMatricula({
  to,
  userName,
}: {
  to: string;
  userName: string;
}) {
  const primeiroNome = userName.trim().split(/\s+/)[0];

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Olá, <strong>${primeiroNome}</strong>!</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Para quem precisa apenas da <strong>declaração de matrícula</strong>, ela já está disponível na área do aluno. Você pode baixá-la a qualquer hora, sem precisar pedir para a coordenação.</p>
    <div style="background:#f0f9fa;border-left:4px solid #00475e;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 10px;color:#00475e;font-size:14px;font-weight:700;">Como baixar</p>
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">1. Entre em <a href="${APP_URL}/dashboard" style="color:#00475e;">nuvemensino.com.br/dashboard</a> com o seu login.</p>
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">2. Clique em <strong>Meus cursos</strong>, no menu da esquerda.</p>
      <p style="margin:0;color:#374151;font-size:14px;">3. No cartão do curso, clique em <strong>Baixar declaração de matrícula</strong>.</p>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">O PDF sai na hora, com seus dados, a carga horária, o período do curso e a assinatura da Dra. Vera Ângelo. O certificado é emitido pela Faculdade FACOP, instituição credenciada pelo MEC.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;"><strong>Atenção:</strong> se o seu CPF ainda não estiver no cadastro, o site vai pedir na primeira vez. É só digitar.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${APP_URL}/dashboard"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Acessar a área do aluno
      </a>
    </div>
    <div style="background:#f0f7f8;border:1px solid #cbe4e6;border-radius:12px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 8px;color:#00475e;font-size:14px;font-weight:700;">Precisa de nota fiscal?</p>
      <p style="margin:0 0 8px;color:#374151;font-size:14px;">É só responder a este e-mail com os seus dados:</p>
      <p style="margin:0 0 4px;color:#374151;font-size:14px;">• Nome completo</p>
      <p style="margin:0 0 4px;color:#374151;font-size:14px;">• CPF</p>
      <p style="margin:0;color:#374151;font-size:14px;">• Endereço completo, com CEP</p>
    </div>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Qualquer dúvida, estamos à disposição. Um abraço, Equipe NUVEM Ensino.</p>
  `;

  return deliver("aviso declaração de matrícula", to, {
    from: FROM,
    to,
    subject: "Sua declaração de matrícula já está disponível na área do aluno",
    html: baseLayout("Declaração de matrícula", body),
  });
}

/** Por que a pessoa está na lista fechada do DICI — aparece no e-mail. */
export type OrigemListaFechada = "live de julho" | "aula gratuita" | "teste respiratório";

const MOTIVO_LISTA_FECHADA: Record<OrigemListaFechada, { abertura: string; rodape: string }> = {
  "live de julho": {
    abertura: "Você esteve com a gente na live do DICI, em julho, com a Dra. Vera Ângelo.",
    rodape: "você se inscreveu na live do DICI de julho",
  },
  "aula gratuita": {
    abertura: "Você assistiu à aula gratuita do 5º encontro do DICI, com a Dra. Vera Ângelo.",
    rodape: "você se inscreveu na aula gratuita do DICI",
  },
  "teste respiratório": {
    abertura: "Você já estudou com a NU.V.E.M Ensino no curso de testes respiratórios.",
    rodape: "você estudou num curso de testes respiratórios da NU.V.E.M Ensino",
  },
};

/**
 * Convite com 50% no DICI para a lista fechada (alunos dos cursos de teste
 * respiratório e inscritos nas lives que ainda não são do DICI).
 *
 * Cada pessoa tem um código próprio, de uso único: o desconto não é público e
 * não pode ser repassado. O texto diz de onde veio o contato, porque a live de
 * julho não pedia consentimento, e oferece a saída por resposta.
 */
export function montarConviteListaFechadaDici({
  nome,
  origem,
  codigo,
  link,
  validoAte,
}: {
  nome: string;
  origem: OrigemListaFechada;
  codigo: string;
  link: string;
  validoAte: string;
}) {
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const saudacao = primeiroNome ? `Olá, <strong>${primeiroNome}</strong>!` : "Olá!";
  const motivo = MOTIVO_LISTA_FECHADA[origem];

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">${saudacao}</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">${motivo.abertura} Por isso, antes de abrir a campanha ao público, separamos uma condição só para você no <strong>Curso de Aperfeiçoamento em DICI: Neurogastroenterologia e Métodos Diagnósticos Complementares</strong>.</p>
    <div style="background:#f0f7f8;border:1px solid #cbe4e6;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 6px;color:#00475e;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">50% de desconto · código pessoal</p>
      <p style="margin:0 0 10px;color:#00475e;font-size:26px;font-weight:700;letter-spacing:0.06em;">${codigo}</p>
      <p style="margin:0 0 6px;color:#6b7280;font-size:14px;"><s>R$ 2.998</s> &nbsp;→&nbsp; <strong style="color:#00475e;font-size:18px;">R$ 1.499 à vista</strong></p>
      <p style="margin:0 0 10px;color:#00475e;font-size:15px;font-weight:600;">ou 5x de R$ 299,80 sem juros</p>
      <p style="margin:0;color:#6b7280;font-size:13px;">Válido até ${validoAte}, para uma matrícula.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Garantir minha vaga com 50%
      </a>
    </div>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;">O curso já começou, e isso não é problema: <strong>todas as aulas ficam gravadas</strong>. Você assiste no seu ritmo e ainda participa ao vivo do último encontro, em 25/11.</p>
    <div style="background:#f0f9fa;border-left:4px solid #00475e;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">✔ 96h com certificado MEC/FACOP</p>
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">✔ 16 aulas gravadas em 4 módulos, baseadas nos Critérios de Roma V</p>
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">✔ Gravação dos encontros já realizados e o 8º encontro ao vivo</p>
      <p style="margin:0;color:#374151;font-size:14px;">✔ Módulos bônus “Como eu faço”</p>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">O link acima já abre o pagamento com o desconto aplicado. Qualquer dúvida, é só responder este e-mail.</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;">Um abraço,<br/>Equipe NU.V.E.M Ensino</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Você recebeu este e-mail porque ${motivo.rodape}. Se não quiser receber nossos próximos contatos, responda com “SAIR”.</p>
  `;

  return {
    subject: "Uma condição só para você no DICI: 50% de desconto",
    html: baseLayout("Uma condição só para você", body),
  };
}

export async function sendConviteListaFechadaDici(
  to: string,
  dados: Parameters<typeof montarConviteListaFechadaDici>[0],
) {
  const { subject, html } = montarConviteListaFechadaDici(dados);
  return deliver("lista fechada DICI 50%", to, { from: FROM, to, subject, html });
}

/**
 * Aviso a quem se inscreveu em /live de que a live mudou de 18/11 para 25/11
 * e ganhou tema próprio (probióticos). A inscrição continua valendo.
 */
export function montarAvisoNovaDataLive({ nome }: { nome: string }) {
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const saudacao = primeiroNome ? `Olá, <strong>${primeiroNome}</strong>!` : "Olá!";

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">${saudacao}</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Obrigado por se inscrever na live com a Dra. Vera Ângelo. Temos uma novidade: a live <strong>mudou de data</strong> e ganhou um tema que é pergunta de todo dia no consultório.</p>
    <div style="background:#f0f7f8;border:1px solid #cbe4e6;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 6px;color:#00475e;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Live gratuita · nova data</p>
      <p style="margin:0 0 8px;color:#00475e;font-size:22px;font-weight:700;">Probióticos na prática clínica</p>
      <p style="margin:0 0 4px;color:#374151;font-size:15px;"><s style="color:#9ca3af;">18/11</s> &nbsp;→&nbsp; <strong>Quarta, 25/11, às 19h30</strong></p>
      <p style="margin:0;color:#6b7280;font-size:13px;">Ao vivo pelo YouTube, com a Dra. Vera Ângelo</p>
    </div>
    <p style="margin:0 0 10px;color:#374151;font-size:15px;">Na live, a Dra. Vera vai mostrar:</p>
    <div style="background:#f0f9fa;border-left:4px solid #00475e;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">✔ Quando o probiótico tem evidência e quando é só gasto</p>
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">✔ Por que a cepa e a dose importam mais do que a marca</p>
      <p style="margin:0;color:#374151;font-size:14px;">✔ Como indicar nos distúrbios intestinais do dia a dia</p>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;"><strong>Você não precisa se inscrever de novo.</strong> Sua inscrição continua valendo, e o link da transmissão chega por e-mail antes da live.</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Se quiser chamar um colega, o link de inscrição é este:</p>
    <div style="text-align:center;margin:20px 0 28px;">
      <a href="${APP_URL}/live?utm_source=email&utm_medium=inscritos&utm_campaign=live-probioticos"
         style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;display:inline-block;">
        Ver a página da live
      </a>
    </div>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;">Até lá!<br/>Equipe NU.V.E.M Ensino</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Você recebeu este e-mail porque se inscreveu na live da NU.V.E.M Ensino. Se não quiser receber nossos próximos contatos, responda com “SAIR”.</p>
  `;

  return {
    subject: "A live mudou: Probióticos na prática clínica, 25/11 às 19h30",
    html: baseLayout("A live mudou de data", body),
  };
}

export async function sendAvisoNovaDataLive(to: string, dados: Parameters<typeof montarAvisoNovaDataLive>[0]) {
  const { subject, html } = montarAvisoNovaDataLive(dados);
  return deliver("aviso nova data da live", to, { from: FROM, to, subject, html });
}

// ─── Live "Probióticos na prática clínica" (25/11/2026) ─────────────────────
// Três lembretes aos inscritos (véspera, manhã do dia, 1 hora antes) e três
// e-mails depois da live, com a gravação e a oferta de 30% do DICI, que acaba
// em 29/11. Disparo por prisma/enviar-emails-live-probioticos.ts.

export type EtapaLiveProbioticos = "vespera" | "hoje" | "1hora" | "gravacao" | "blackfriday" | "ultimodia";

export const ETAPAS_LIVE_PROBIOTICOS: EtapaLiveProbioticos[] = ["vespera", "hoje", "1hora", "gravacao", "blackfriday", "ultimodia"];

/** As três últimas levam a oferta do DICI: não vão para quem já é aluno. */
export const ETAPAS_COM_OFERTA: EtapaLiveProbioticos[] = ["gravacao", "blackfriday", "ultimodia"];

function linkOfertaDici(etapa: EtapaLiveProbioticos) {
  return `${APP_URL}/checkout/dici-neurogastroenterologia-2026?cupom=AINDADATEMPO&utm_source=email&utm_medium=inscritos-live&utm_campaign=black-november&utm_content=${etapa}`;
}

function linkPaginaDici(etapa: EtapaLiveProbioticos) {
  return `${APP_URL}/cursos/dici-neurogastroenterologia-2026?utm_source=email&utm_medium=inscritos-live&utm_campaign=black-november&utm_content=${etapa}`;
}

function botaoLive(href: string, texto: string) {
  return `<div style="text-align:center;margin:24px 0 28px;">
      <a href="${href}" style="background:#00475e;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:15px;font-weight:600;display:inline-block;">${texto}</a>
    </div>`;
}

function cartaoLive(rotulo: string, quando: string) {
  return `<div style="background:#f0f7f8;border:1px solid #cbe4e6;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 6px;color:#00475e;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">${rotulo}</p>
      <p style="margin:0 0 8px;color:#00475e;font-size:22px;font-weight:700;">Probióticos na prática clínica</p>
      <p style="margin:0 0 4px;color:#374151;font-size:15px;"><strong>${quando}</strong></p>
      <p style="margin:0;color:#6b7280;font-size:13px;">Ao vivo pelo YouTube, com a Dra. Vera Ângelo</p>
    </div>`;
}

const pLive = (t: string) => `<p style="margin:0 0 16px;color:#374151;font-size:15px;">${t}</p>`;

const AVISO_INSCRICAO_LIVE = `<p style="margin:0;color:#9ca3af;font-size:12px;">Você recebeu este e-mail porque se inscreveu na live da NU.V.E.M Ensino. Se não quiser receber nossos próximos contatos, responda com “SAIR”.</p>`;

const assinaturaLive = (despedida: string) =>
  `<p style="margin:0 0 24px;color:#374151;font-size:15px;">${despedida}<br/>Equipe NU.V.E.M Ensino</p>
    ${AVISO_INSCRICAO_LIVE}`;

const CARTAO_DICI = `<div style="background:#f0f9fa;border-left:4px solid #00475e;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 10px;color:#00475e;font-size:15px;font-weight:700;">DICI: Neurogastroenterologia e Métodos Diagnósticos Complementares</p>
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">✔ 96 horas, com certificado da FACOP, instituição credenciada pelo MEC</p>
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">✔ 16 temas em 4 módulos, dos Critérios de Roma V aos testes respiratórios, manometria e pHmetria</p>
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">✔ Módulos bônus “Como eu faço”, com 16 horas de conteúdo prático</p>
      <p style="margin:0;color:#374151;font-size:14px;">✔ Aulas e encontros gravados, com <strong>um ano de acesso</strong> para assistir no seu ritmo</p>
    </div>`;

function cartaoOferta(prazo: string) {
  return `<div style="background:#00475e;border-radius:12px;padding:20px;margin:0 0 8px;text-align:center;">
      <p style="margin:0 0 4px;color:#cbe4e6;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Black November</p>
      <p style="margin:0 0 4px;color:#ffffff;font-size:24px;font-weight:700;">30% de desconto</p>
      <p style="margin:0 0 8px;color:#ffffff;font-size:15px;">em até 5x sem juros no cartão</p>
      <p style="margin:0;color:#cbe4e6;font-size:13px;">${prazo} · cupom <strong style="color:#ffffff;">AINDADATEMPO</strong> já aplicado pelo botão</p>
    </div>`;
}

export function montarEmailLiveProbioticos(
  etapa: EtapaLiveProbioticos,
  { nome, linkYoutube }: { nome: string; linkYoutube: string },
) {
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const ola = primeiroNome ? `Olá, <strong>${primeiroNome}</strong>!` : "Olá!";
  const agenda =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent("Live: Probióticos na prática clínica (NU.V.E.M Ensino)")}` +
    "&dates=20261125T223000Z/20261126T003000Z" +
    `&details=${encodeURIComponent(`Ao vivo com a Dra. Vera Ângelo: ${linkYoutube}`)}`;

  switch (etapa) {
    case "vespera":
      return {
        subject: "É amanhã: Probióticos na prática clínica, às 19h30",
        html: baseLayout("A live é amanhã", `
    ${pLive(ola)}
    ${pLive("Amanhã à noite a Dra. Vera Ângelo responde, ao vivo, uma pergunta que aparece todo dia no consultório: quando o probiótico tem evidência e quando é só gasto?")}
    ${cartaoLive("Live gratuita · amanhã", "Quarta, 25/11, às 19h30")}
    ${pLive("Ela vai mostrar por que a cepa e a dose importam mais do que a marca e como indicar nos distúrbios intestinais do dia a dia. No fim, responde às perguntas do chat.")}
    ${pLive("O link da transmissão já está pronto. Salve na sua agenda para não perder:")}
    ${botaoLive(agenda, "Salvar na minha agenda")}
    ${pLive(`Link do YouTube: <a href="${linkYoutube}" style="color:#00475e;">${linkYoutube}</a>`)}
    ${assinaturaLive("Até amanhã!")}`),
      };

    case "hoje":
      return {
        subject: "Hoje, 19h30: live com a Dra. Vera sobre probióticos",
        html: baseLayout("A live é hoje", `
    ${pLive(ola)}
    ${pLive("É hoje! A live gratuita com a Dra. Vera Ângelo começa às <strong>19h30</strong>, ao vivo pelo YouTube.")}
    ${cartaoLive("Live gratuita · hoje", "Hoje, 25/11, às 19h30")}
    ${pLive("Traga suas dúvidas sobre probióticos: a Dra. Vera reserva o fim da live para responder às perguntas do chat.")}
    ${botaoLive(linkYoutube, "Abrir a transmissão")}
    ${pLive("Dica: clique em “Notifique-me” no YouTube para receber um aviso quando a live começar.")}
    ${assinaturaLive("Até a noite!")}`),
      };

    case "1hora":
      return {
        subject: "Começa em 1 hora: Probióticos na prática clínica",
        html: baseLayout("Começa em 1 hora", `
    ${pLive(ola)}
    ${pLive("Falta 1 hora! Às <strong>19h30</strong> a Dra. Vera Ângelo entra ao vivo para falar de probióticos na prática clínica.")}
    ${botaoLive(linkYoutube, "Entrar na live")}
    ${pLive("O chat abre alguns minutos antes. Até já!")}
    ${AVISO_INSCRICAO_LIVE}`),
      };

    case "gravacao":
      return {
        subject: "A gravação da live de probióticos (e um convite da Dra. Vera)",
        html: baseLayout("Obrigada por estar com a gente", `
    ${pLive(ola)}
    ${pLive("Obrigada por se inscrever na live de ontem. Se não conseguiu assistir, ou quer rever algum trecho, a gravação está no YouTube:")}
    ${botaoLive(linkYoutube, "Assistir à gravação")}
    ${pLive("O probiótico é só uma parte da história. Entender o eixo cérebro-intestino-microbiota, aplicar os Critérios de Roma V e saber pedir e interpretar os exames complementares é o que muda a conduta. É isso que a Dra. Vera e a equipe ensinam no DICI:")}
    ${CARTAO_DICI}
    ${pLive("O curso começou em agosto, mas <strong>ainda dá tempo</strong>: quem entra agora assiste a tudo gravado, faz as avaliações e recebe o certificado.")}
    ${cartaoOferta("Até domingo, 29/11, às 23h59")}
    ${botaoLive(linkOfertaDici("gravacao"), "Garantir minha vaga com 30%")}
    ${pLive(`Quer ver o programa completo antes? <a href="${linkPaginaDici("gravacao")}" style="color:#00475e;">Conheça a página do curso</a>.`)}
    ${assinaturaLive("Um abraço,")}`),
      };

    case "blackfriday":
      return {
        subject: "Black Friday: últimos 3 dias com 30% no DICI",
        html: baseLayout("Últimos 3 dias", `
    ${pLive(ola)}
    ${pLive("Hoje é Black Friday, e a oferta do curso DICI entra nos <strong>últimos 3 dias</strong>. Não vamos aumentar o desconto: os 30% valem até domingo e, depois disso, o curso volta ao valor normal.")}
    ${cartaoOferta("Termina domingo, 29/11, às 23h59")}
    ${botaoLive(linkOfertaDici("blackfriday"), "Quero os 30% de desconto")}
    ${CARTAO_DICI}
    ${pLive(`Ainda não viu a live de probióticos? <a href="${linkYoutube}" style="color:#00475e;">A gravação está aqui</a>.`)}
    ${assinaturaLive("Um abraço,")}`),
      };

    case "ultimodia":
      return {
        subject: "Termina hoje à meia-noite: 30% no DICI",
        html: baseLayout("Termina hoje", `
    ${pLive(ola)}
    ${pLive("Último aviso: o desconto de 30% no curso DICI, com a Dra. Vera Ângelo, <strong>termina hoje às 23h59</strong>.")}
    ${pLive("Quem entra agora assiste a todas as aulas e encontros gravados, com um ano de acesso, faz as avaliações e recebe o certificado de 96 horas da FACOP.")}
    ${cartaoOferta("Só até hoje, 29/11, às 23h59")}
    ${botaoLive(linkOfertaDici("ultimodia"), "Garantir minha vaga agora")}
    ${pLive("Ficou alguma dúvida? É só responder a este e-mail ou chamar no WhatsApp (31) 97229-1029.")}
    ${assinaturaLive("Um abraço,")}`),
      };
  }
}

export async function sendEmailLiveProbioticos(
  etapa: EtapaLiveProbioticos,
  to: string,
  dados: Parameters<typeof montarEmailLiveProbioticos>[1],
) {
  const { subject, html } = montarEmailLiveProbioticos(etapa, dados);
  return deliver(`live probióticos (${etapa})`, to, { from: FROM, to, subject, html });
}

// ─── Super live de encerramento do DICI (25/11/2026) ─────────────────────────
// O 8º e último encontro síncrono do DICI virou a live aberta de probióticos, no
// YouTube (não listada), em vez do Google Meet. Aviso aos alunos e lembrete do
// dia. Disparo por prisma/enviar-super-live-encerramento-dici.ts.

export function montarSuperLiveEncerramentoDici(
  tipo: "aviso" | "lembrete",
  { nome, linkYoutube }: { nome: string; linkYoutube: string },
) {
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const ola = primeiroNome ? `Olá, <strong>${primeiroNome}</strong>!` : "Olá!";
  const linkColegas = `${APP_URL}/live?utm_source=email&utm_medium=alunos-dici&utm_campaign=live-probioticos`;
  const naoEMeet = pLive(
    "<strong>Atenção: desta vez não é pelo Google Meet.</strong> O encontro acontece no YouTube, neste link:",
  );

  if (tipo === "lembrete") {
    return {
      subject: "Hoje, 19h30: super live de encerramento do DICI, no YouTube",
      html: baseLayout("É hoje", `
    ${pLive(ola)}
    ${pLive("Hoje é o nosso último encontro do Curso de Aperfeiçoamento em DICI: a super live de encerramento com a Dra. Vera Ângelo, às <strong>19h30</strong>.")}
    ${cartaoLive("Super live de encerramento · hoje", "Hoje, 25/11, às 19h30")}
    ${naoEMeet}
    ${botaoLive(linkYoutube, "Abrir a live no YouTube")}
    ${pLive("Traga suas dúvidas: a Dra. Vera reserva o fim da live para responder às perguntas do chat.")}
    <p style="margin:0 0 24px;color:#374151;font-size:15px;">Até a noite!<br/>Equipe NU.V.E.M Ensino</p>`),
    };
  }

  return {
    subject: "Encerramento do DICI: super live com a Dra. Vera, quarta às 19h30",
    html: baseLayout("Super live de encerramento", `
    ${pLive(ola)}
    ${pLive("O nosso 8º e último encontro do Curso de Aperfeiçoamento em DICI vai ser diferente: uma <strong>super live de encerramento</strong>, ao vivo pelo YouTube, com a Dra. Vera Ângelo.")}
    ${cartaoLive("Super live de encerramento", "Quarta, 25/11, às 19h30")}
    <p style="margin:0 0 10px;color:#374151;font-size:15px;">O tema é uma pergunta de todo dia no consultório. A Dra. Vera vai mostrar:</p>
    <div style="background:#f0f9fa;border-left:4px solid #00475e;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">✔ Quando o probiótico tem evidência e quando é só gasto</p>
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">✔ Por que a cepa e a dose importam mais do que a marca</p>
      <p style="margin:0;color:#374151;font-size:14px;">✔ Como indicar nos distúrbios intestinais do dia a dia</p>
    </div>
    ${naoEMeet}
    ${botaoLive(linkYoutube, "Abrir a live no YouTube")}
    ${pLive("Dica: abra o link agora e clique em “Notifique-me” para o YouTube avisar quando a live começar. No dia, mandamos um lembrete.")}
    ${pLive(`Se quiser chamar um colega, ele se inscreve por aqui: <a href="${linkColegas}" style="color:#00475e;">nuvemensino.com.br/live</a>.`)}
    <p style="margin:0 0 24px;color:#374151;font-size:15px;">Até quarta!<br/>Equipe NU.V.E.M Ensino</p>`),
  };
}

export async function sendSuperLiveEncerramentoDici(
  tipo: "aviso" | "lembrete",
  to: string,
  dados: Parameters<typeof montarSuperLiveEncerramentoDici>[1],
) {
  const { subject, html } = montarSuperLiveEncerramentoDici(tipo, dados);
  return deliver(`super live encerramento DICI (${tipo})`, to, { from: FROM, to, subject, html });
}
