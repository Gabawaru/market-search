"use client";

import { useEffect } from "react";
import { playSound } from "@/lib/sound/playSound";

/** Bannière de résultat de la boîte surprise : jouée une fois à l'ouverture (son + animation
 * d'entrée déjà présents dans le projet). Le jackpot est purement des points internes — jamais une
 * récompense à valeur monétaire réelle. */
export function MysteryBoxResult({
  rewardPoints,
  isJackpot,
}: {
  rewardPoints: number;
  isJackpot: boolean;
}) {
  useEffect(() => {
    // "streak" est le son le plus festif du projet (arpège montant) — réutilisé pour le jackpot.
    playSound(isJackpot ? "streak" : "correct");
  }, [isJackpot]);

  return (
    <div
      className={`animate-[feedback-in_0.3s_ease-out] rounded-lg border p-4 text-center ${
        isJackpot
          ? "border-amber-300 bg-amber-50 text-amber-800"
          : "border-emerald-300 bg-emerald-50 text-emerald-800"
      }`}
    >
      <div className="text-3xl">{isJackpot ? "🎉🎁🎉" : "🎁"}</div>
      <div className="mt-1 font-semibold">
        {isJackpot ? "JACKPOT !" : "Bravo !"} Tu gagnes {rewardPoints} points
      </div>
      <p className="mt-1 text-sm">
        {isJackpot
          ? "Le lot rare de la boîte surprise — reviens tenter ta chance demain !"
          : "Reviens ouvrir une nouvelle boîte demain !"}
      </p>
    </div>
  );
}
