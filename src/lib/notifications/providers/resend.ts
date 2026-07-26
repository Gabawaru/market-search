import type { EmailSender } from "@/lib/notifications/types";

// Intégration minimale de l'API Resend (https://resend.com/docs/api-reference/emails/send-email).
// Nécessite RESEND_API_KEY — non testée contre un vrai compte (aucune clé fournie en dev).
export const resendEmailSender: EmailSender = {
  name: "resend",
  async send({ to, subject, body }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY n'est pas configuré");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Oumno Éducation <onboarding@resend.dev>",
        to: [to],
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      throw new Error(`Échec de l'envoi email Resend : ${res.status} ${await res.text()}`);
    }
  },
};
