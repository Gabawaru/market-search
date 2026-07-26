import type { SmsSender } from "@/lib/notifications/types";

// Intégration minimale de l'API Twilio — nécessite TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM_NUMBER.
// Non testée contre un vrai compte (aucune clé fournie en dev).
export const twilioSmsSender: SmsSender = {
  name: "twilio",
  async send({ to, body }) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Configuration Twilio incomplète");
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams({ To: to, From: fromNumber, Body: body });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!res.ok) {
      throw new Error(`Échec de l'envoi SMS Twilio : ${res.status} ${await res.text()}`);
    }
  },
};
