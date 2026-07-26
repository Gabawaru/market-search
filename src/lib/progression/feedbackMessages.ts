// Pool de messages variés pour éviter la répétition ("Bravo" en boucle) tout en restant
// constructif sur les erreurs plutôt qu'un simple "Faux" — cf. plan produit.

const CORRECT_MESSAGES = [
  "Bravo, bonne réponse !",
  "Exactement !",
  "Bien joué, continue comme ça !",
  "Parfait !",
  "C'est ça !",
  "Super, tu progresses bien !",
];

const INCORRECT_MESSAGES_PREFIX = [
  "Pas tout à fait — la bonne réponse était",
  "Presque ! La bonne réponse était",
  "Pas cette fois, la bonne réponse était",
];

export function pickCorrectMessage(): string {
  return CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
}

export function pickIncorrectMessage(correctAnswer: string): string {
  const prefix =
    INCORRECT_MESSAGES_PREFIX[Math.floor(Math.random() * INCORRECT_MESSAGES_PREFIX.length)];
  return `${prefix} ${correctAnswer}.`;
}
