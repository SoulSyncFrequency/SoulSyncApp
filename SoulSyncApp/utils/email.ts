import nodemailer from "nodemailer";

export async function sendResetEmail(to: string, resetUrlOrToken: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@soulsync.app";

  if (!host || !user || !pass) {
    console.log("📧 [DEV] Email not configured. Would send to", to, "with:", resetUrlOrToken);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass }
  });

  await transporter.sendMail({
    from,
    to,
    subject: "Password reset",
    text: `Use this link or token to reset your password: ${resetUrlOrToken}`
  });
}
