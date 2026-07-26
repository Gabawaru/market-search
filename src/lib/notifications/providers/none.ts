import type { EmailSender, SmsSender } from "@/lib/notifications/types";

// Fournisseur par défaut : ne fait rien de réel, journalise seulement. Le digest reste
// consultable dans l'espace développeur même sans clé API configurée.
export const noneEmailSender: EmailSender = {
  name: "none",
  async send({ to, subject }) {
    console.log(`[notifications] (aucun fournisseur email configuré) → ${to} : ${subject}`);
  },
};

export const noneSmsSender: SmsSender = {
  name: "none",
  async send({ to }) {
    console.log(`[notifications] (aucun fournisseur SMS configuré) → ${to}`);
  },
};
