import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; text: string; html?: string };
type MailResult = { ok: true } | { ok: false; error: string };
type Transporter = ReturnType<typeof nodemailer.createTransport>;

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  const port = Number(SMTP_PORT ?? 465);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  const t = getTransporter();

  if (!t) {
    // SMTP নেই: শুধু development-এ terminal-এ ছাপা হবে
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n📧 [DEV MAIL] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n`);
      return { ok: true };
    }
    console.error("SMTP কনফিগার করা নেই");
    return { ok: false, error: "Email পাঠানোর ব্যবস্থা এখনো চালু হয়নি" };
  }

  try {
    await t.sendMail({ from: process.env.MAIL_FROM ?? process.env.SMTP_USER, ...mail });
    return { ok: true };
  } catch (e) {
    console.error("mail error:", e);
    return { ok: false, error: "Email পাঠানো যায়নি, একটু পরে আবার চেষ্টা করো" };
  }
}