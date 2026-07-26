import { SignJWT, jwtVerify } from "jose";

// Court terme volontairement : force un heartbeat régulier tant que l'évaluation est active.
// Si le heartbeat s'arrête (onglet caché, plein écran quitté, etc.), le token expire et le
// serveur rejette toute réponse suivante — c'est le mécanisme concret qui empêche de répondre
// sans une session active et surveillée.
const EVALUATION_TOKEN_TTL_SECONDS = 20;

function getSecret() {
  const secret = process.env.CHILD_SESSION_SECRET;
  if (!secret) throw new Error("CHILD_SESSION_SECRET n'est pas configuré");
  return new TextEncoder().encode(secret);
}

export interface EvaluationTokenPayload {
  evaluationId: string;
  childId: string;
}

export async function issueEvaluationToken(payload: EvaluationTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EVALUATION_TOKEN_TTL_SECONDS}s`)
    .sign(getSecret());
}

/** Valide le JWT (signature + expiration) ET qu'il correspond bien à l'évaluation/l'enfant
 * attendus. Ne fait jamais confiance à un verdict envoyé par le client. */
export async function verifyEvaluationToken(
  token: string,
  expected: EvaluationTokenPayload,
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.evaluationId === expected.evaluationId && payload.childId === expected.childId;
  } catch {
    return false;
  }
}
