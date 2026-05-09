const from = process.env.SMTP_FROM ?? "no-reply@localhost";

export async function sendTransactionalEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log(
      "[email] SMTP_HOST unset — would send:",
      options.subject,
      "→",
      options.to,
    );
    return;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
  });

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html ?? options.text,
  });
}
