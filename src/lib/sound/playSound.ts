// Sons de progression synthétisés via Web Audio API — pas de fichier audio à héberger, aucune
// question de licence, gratuit par construction. Cohérent avec le reste du projet (rien qui
// dépende d'un service/asset externe payant).

export type SoundKind = "correct" | "incorrect" | "streak";

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!sharedContext) {
    sharedContext = new AudioContextCtor();
  }
  if (sharedContext.state === "suspended") {
    void sharedContext.resume();
  }
  return sharedContext;
}

function playTone(ctx: AudioContext, frequency: number, startAt: number, durationSeconds: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  // Enveloppe courte (attaque rapide, extinction en douceur) pour un "blip" net, pas un bourdonnement.
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.2, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + durationSeconds);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationSeconds);
}

const NOTES: Record<SoundKind, number[]> = {
  correct: [660, 880],
  incorrect: [220],
  streak: [523, 659, 784],
};

/** Best-effort : ne fait jamais échouer l'appelant (un enfant ne doit jamais voir une erreur
 * à cause d'un son qui ne joue pas — navigateur sans Web Audio, contexte bloqué, etc.). */
export function playSound(kind: SoundKind) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = NOTES[kind];
    const noteDuration = 0.16;
    notes.forEach((frequency, index) => {
      playTone(ctx, frequency, ctx.currentTime + index * noteDuration, noteDuration);
    });
  } catch {
    // silencieux — un son manqué n'est jamais bloquant
  }
}
