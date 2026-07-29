import { randomBytes, createHash } from "node:crypto";

// Un jeton de réinitialisation est déjà une valeur aléatoire à haute entropie (contrairement à
// un mot de passe choisi par un humain) — pas besoin du hachage lent/salé de bcrypt, qui rendrait
// d'ailleurs impossible une recherche par égalité exacte en base (tokenHash @unique). Un simple
// hachage déterministe (SHA-256) suffit : il empêche de retrouver le jeton en clair depuis la
// base tout en permettant `findUnique({ where: { tokenHash } })`.
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// NEXTAUTH_URL est déjà requis en production pour NextAuth lui-même (redirections après
// connexion) — on le réutilise pour construire le lien de réinitialisation envoyé par email.
export function getAppBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}
