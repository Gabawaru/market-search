import type {
  AiTextDetectionInput,
  AiTextDetectionResult,
  AiTextDetector,
  AiTextSignal,
} from "@/lib/integrity/aiTextDetector/types";

// Tournures typiques d'un texte généré par une IA en français — jamais 100% fiable seule,
// c'est un signal parmi d'autres, combiné avec les autres heuristiques ci-dessous.
const FORMAL_CONNECTOR_PATTERNS = [
  /en conclusion/i,
  /il est important de noter que/i,
  /par cons[ée]quent/i,
  /en effet,/i,
  /de plus,/i,
  /en somme/i,
  /d['’]une part.*d['’]autre part/i,
  /en r[ée]sum[ée]/i,
  /il convient de/i,
  /tout d['’]abord/i,
];

function splitWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function looksPerfectlyPunctuated(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  const startsCapitalized = /^[A-ZÀ-Ý]/.test(trimmed);
  const endsWithPunctuation = /[.!?]$/.test(trimmed);
  const noDoubleSpaces = !/\s{2,}/.test(trimmed);
  const noRepeatedPunctuation = !/[.!?]{2,}$/.test(trimmed) || /\?!|!\?/.test(trimmed);
  return startsCapitalized && endsWithPunctuation && noDoubleSpaces && noRepeatedPunctuation;
}

async function detect(input: AiTextDetectionInput): Promise<AiTextDetectionResult> {
  const { text, timeTakenMs, writingProfile } = input;
  const words = splitWords(text);
  const sentences = splitSentences(text);
  const signals: AiTextSignal[] = [];

  // 1. Vitesse d'écriture implausible pour un texte long
  const charsPerSecond = timeTakenMs > 0 ? (text.length / timeTakenMs) * 1000 : 0;
  const speedValue =
    text.length > 25 ? clamp((charsPerSecond - 8) / (20 - 8), 0, 1) : 0;
  signals.push({ name: "writingSpeed", value: speedValue, weight: 20, contribution: speedValue * 20 });

  // 2. Connecteurs formels typiques d'une IA
  const connectorMatches = FORMAL_CONNECTOR_PATTERNS.reduce(
    (count, pattern) => count + (pattern.test(text) ? 1 : 0),
    0,
  );
  const connectorValue = clamp(connectorMatches / 2, 0, 1);
  signals.push({
    name: "formalConnectors",
    value: connectorValue,
    weight: 25,
    contribution: connectorValue * 25,
  });

  // 3. Écart à la baseline personnelle de l'enfant (signal le plus fiable) ou, à défaut,
  // à un seuil générique pour un enfant.
  const avgWordLength =
    words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0;
  const wordLengthBaseline = writingProfile?.avgWordLength ?? 4.2;
  const wordLengthValue = clamp((avgWordLength - wordLengthBaseline) / 3, 0, 1);
  signals.push({
    name: "vocabComplexity",
    value: wordLengthValue,
    weight: 20,
    contribution: wordLengthValue * 20,
  });

  // 4. Longueur de phrase inhabituelle par rapport à la baseline (ou seuil générique)
  const avgSentenceLength =
    sentences.length > 0
      ? sentences.reduce((sum, s) => sum + splitWords(s).length, 0) / sentences.length
      : words.length;
  const sentenceLengthBaseline = writingProfile?.avgSentenceLength ?? 8;
  const sentenceLengthValue = clamp((avgSentenceLength - sentenceLengthBaseline) / 10, 0, 1);
  signals.push({
    name: "sentenceLength",
    value: sentenceLengthValue,
    weight: 15,
    contribution: sentenceLengthValue * 15,
  });

  // 5. Perfection structurelle inhabituelle (ponctuation/accords parfaits) par rapport au
  // taux de fautes habituel de l'enfant
  const commonErrorRate = writingProfile?.commonErrorRate ?? 0.15;
  const isPerfect = looksPerfectlyPunctuated(text) && text.length > 20;
  const perfectionValue = isPerfect ? clamp(commonErrorRate / 0.1, 0, 1) : 0;
  signals.push({
    name: "structuralPerfection",
    value: perfectionValue,
    weight: 20,
    contribution: perfectionValue * 20,
  });

  const suspicionScore = clamp(
    signals.reduce((sum, s) => sum + s.contribution, 0),
    0,
    100,
  );

  return {
    suspicionScore,
    signals,
    detectorName: heuristicDetector.name,
    detectorVersion: heuristicDetector.version,
  };
}

export const heuristicDetector: AiTextDetector = {
  name: "heuristic",
  version: "1.0.0",
  detect,
};
