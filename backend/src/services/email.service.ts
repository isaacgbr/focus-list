import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

let active = 0;

class EmailService {
  async sendPasswordReset(email: string, token: string) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const origin = process.env.FRONTEND_ORIGIN ?? (process.env.NODE_ENV === "production" ? undefined : "http://localhost:5173");
    if (!apiKey || !from || !origin) throw new Error("Envio de recuperação não configurado.");
    const url = new URL(origin);
    if (url.origin !== origin || !["http:", "https:"].includes(url.protocol) ||
      (process.env.NODE_ENV === "production" && url.protocol !== "https:")) {
      throw new Error("Origem de recuperação inválida.");
    }
    if (active >= 5) throw new Error("Envio de recuperação ocupado.");
    active++;
    try {
      // O fragmento não é enviado ao servidor web nem em cabeçalhos Referer.
      const link = `${origin}/redefinir-senha#token=${token}`;
      const htmlLink = link.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      const logo = await readFile(new URL("../../assets/focuslist-mark-email.png", import.meta.url));
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `password-reset/${randomUUID()}` },
        body: JSON.stringify({
          from, to: [email], subject: "Redefina sua senha do FocusList",
          text: `Redefina sua senha.\n\nVocê solicitou uma nova senha para acessar seu espaço no FocusList.\n\nRedefinir minha senha\n${link}\n\nEste link é válido por 30 minutos e pode ser utilizado apenas uma vez.\n\nNão foi você?\nPode ignorar esta mensagem. Nenhuma alteração será feita na sua conta.\n\nFocusList · Organize. Acompanhe. Conclua.`,
          html: `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#050e19;color:#f7faff;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050e19;"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr><td style="padding-bottom:48px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td><img src="cid:focuslist-mark" width="36" height="36" alt="" style="display:block;border:0;"></td>
<td style="padding-left:10px;font-size:22px;font-weight:bold;color:#f7faff;">Focus<span style="color:#60a5fa;">List</span></td>
</tr></table></td></tr>
<tr><td><h1 style="margin:0 0 20px;font-size:30px;line-height:1.2;letter-spacing:-1px;color:#f7faff;">Redefina sua senha.</h1>
<p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#a9bfda;">Você solicitou uma nova senha para acessar seu espaço no FocusList.</p></td></tr>
<tr><td><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#2265d8" style="border-radius:8px;text-align:center;mso-padding-alt:16px 24px;">
<a href="${htmlLink}" style="display:inline-block;padding:16px 24px;border:1px solid #2265d8;border-radius:8px;background-color:#2265d8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">Redefinir minha senha</a>
</td></tr></table></td></tr>
<tr><td><p style="margin:22px 0 36px;font-size:12px;line-height:1.7;color:#9aafc7;">Este link é válido por 30 minutos e pode ser utilizado apenas uma vez.</p>
<h2 style="margin:0 0 8px;font-size:14px;color:#d6e3f3;">Não foi você?</h2>
<p style="margin:0 0 36px;font-size:13px;line-height:1.7;color:#a9bfda;">Pode ignorar esta mensagem. Nenhuma alteração será feita na sua conta.</p></td></tr>
<tr><td style="border-top:1px solid #203247;padding-top:24px;font-size:11px;line-height:1.7;color:#8098b4;">FocusList · Organize. Acompanhe. Conclua.</td></tr>
</table></td></tr></table></body></html>`,
          attachments: [{ filename: "focuslist-mark.png", content: logo.toString("base64"), content_type: "image/png", content_id: "focuslist-mark" }],
        }),
        signal: AbortSignal.timeout(10_000),
      });
      // Nunca propaga o corpo do provedor, que pode incluir dados sensíveis.
      await response.body?.cancel();
      if (!response.ok) throw new Error("Falha no envio de recuperação.");
    } finally {
      active--;
    }
  }
}

export default new EmailService();
