import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
}
const FROM = process.env.EMAIL_FROM ?? "NU.V.E.M ENSINO <cursos@nuvemensino.com.br>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://cursos.nuvemmedicina.com.br";

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
          <p style="margin:0;color:#9ca3af;font-size:11px;">NU.V.E.M ENSINO · cursos@nuvemensino.com.br · (31) 99726-1029</p>
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
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Dúvidas? Responda este e-mail ou fale pelo WhatsApp <a href="https://wa.me/5531997261029" style="color:#00475e;">(31) 99726-1029</a>.</p>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Matrícula confirmada: ${courseName}`,
    html: baseLayout("Matrícula Confirmada", body),
  });
}

export async function sendPasswordResetEmail({
  to,
  userName,
  token,
}: {
  to: string;
  userName: string;
  token: string;
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
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">⏱ Este link expira em <strong>1 hora</strong>.</p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">Se você não solicitou a redefinição de senha, ignore este e-mail — sua conta permanece segura.</p>
    <p style="margin:0;color:#9ca3af;font-size:12px;">Ou copie e cole este endereço no navegador:<br/><span style="color:#00475e;word-break:break-all;">${link}</span></p>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Redefina sua senha — NU.V.E.M ENSINO",
    html: baseLayout("Redefinição de Senha", body),
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

  return getResend().emails.send({
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
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Dúvidas? Entre em contato pelo WhatsApp <a href="https://wa.me/5531997261029" style="color:#00475e;">(31) 99726-1029</a>.</p>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject,
    html: baseLayout(subject, body),
  });
}
