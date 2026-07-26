import type { EmailSender, SmsSender } from "@/lib/notifications/types";
import { noneEmailSender, noneSmsSender } from "@/lib/notifications/providers/none";
import { resendEmailSender } from "@/lib/notifications/providers/resend";
import { twilioSmsSender } from "@/lib/notifications/providers/twilio";

export function getEmailSender(): EmailSender {
  const provider = process.env.EMAIL_PROVIDER ?? "none";
  if (provider === "resend") return resendEmailSender;
  return noneEmailSender;
}

export function getSmsSender(): SmsSender {
  const provider = process.env.SMS_PROVIDER ?? "none";
  if (provider === "twilio") return twilioSmsSender;
  return noneSmsSender;
}

/** Envoie le digest admin sur les deux canaux configurés (ADMIN_NOTIFY_EMAIL/PHONE) — jamais
 * codés en dur dans le code, toujours lus depuis l'environnement. Échoue silencieusement
 * (journalise) plutôt que de faire planter le scan si un fournisseur est mal configuré. */
export async function sendAdminDigest(subject: string, body: string) {
  const email = process.env.ADMIN_NOTIFY_EMAIL;
  const phone = process.env.ADMIN_NOTIFY_PHONE;
  let emailSent = false;
  let smsSent = false;

  if (email) {
    try {
      await getEmailSender().send({ to: email, subject, body });
      emailSent = true;
    } catch (error) {
      console.error("[notifications] échec envoi email digest admin :", error);
    }
  }

  if (phone) {
    try {
      await getSmsSender().send({ to: phone, body: `${subject}\n${body}`.slice(0, 1000) });
      smsSent = true;
    } catch (error) {
      console.error("[notifications] échec envoi SMS digest admin :", error);
    }
  }

  return { emailSent, smsSent };
}
