import { randomBytes } from "node:crypto";

// Identifiant technique généré quand l'utilisateur n'en saisit pas (ex. inscription avec email
// uniquement, ou compte prof créé depuis une candidature approuvée) — Parent.username/
// Teacher.username sont NOT NULL, il en faut toujours un.
const COMBINING_DIACRITICS = /[\u0300-\u036f]/g;

function slugify(base: string): string {
  return (
    base
      .toLowerCase()
      .normalize("NFD")
      .replace(COMBINING_DIACRITICS, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 20) || "compte"
  );
}

export function generateUsername(base: string): string {
  return `${slugify(base)}-${randomBytes(3).toString("hex")}`;
}
