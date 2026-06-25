interface SendArgs {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

/**
 * Brevo (Sendinblue) transactional e-posta API'si ile mail gönderir.
 * BREVO_API_KEY veya BREVO_SENDER_EMAIL yoksa sessizce atlar.
 */
export async function sendBrevoEmail({
  to,
  toName,
  subject,
  html,
}: SendArgs): Promise<{ skipped: boolean }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) return { skipped: true };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME || "Notvia",
        email: senderEmail,
      },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Brevo ${res.status}: ${await res.text()}`);
  }
  return { skipped: false };
}
