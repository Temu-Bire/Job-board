import nodemailer from 'nodemailer';

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!isConfigured()) {
    // In dev / unconfigured environments, we don't fail the request.
    // The caller should log the reset URL for testing.
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });

  return { skipped: false };
};

