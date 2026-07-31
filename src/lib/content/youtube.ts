/** Extrait l'identifiant de vidéo des formats d'URL YouTube courants (watch?v=, youtu.be/,
 * déjà en embed/) — renvoie null si le format n'est pas reconnu, auquel cas l'appelant doit
 * simplement proposer un lien plutôt qu'un lecteur intégré. */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.hostname.endsWith("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.slice("/embed/".length) || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}
