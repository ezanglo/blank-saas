import type { ReactElement } from "react";

import { render } from "@react-email/render";

const from = process.env.SMTP_FROM ?? "no-reply@localhost";

async function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const nodemailer = await import("nodemailer");
  return nodemailer.createTransport({
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
}

export type SendMailOptions = {
  to: string;
  subject: string;
  /** Plain-text fallback */
  text?: string;
  html?: string;
  /** React Email template — rendered to HTML when SMTP is configured */
  react?: ReactElement;
  /** Reply-To header (e.g. contact form submitter) */
  replyTo?: string;
};

/** Sends transactional mail; logs when `SMTP_HOST` is unset (local dev). */
export async function sendTransactionalEmail(options: SendMailOptions) {
  let html = options.html;
  if (options.react && !html) {
    html = await render(options.react);
  }

  const transport = await getTransport();
  if (!transport) {
    console.log(
      "[email] SMTP_HOST unset — would send:",
      options.subject,
      "→",
      options.to,
    );
    return;
  }

  await transport.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text ?? (html ? undefined : ""),
    html: html ?? options.text,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  });
}
