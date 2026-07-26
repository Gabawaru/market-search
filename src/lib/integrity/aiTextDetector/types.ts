export interface ChildWritingProfileSnapshot {
  avgWordLength?: number | null;
  avgSentenceLength?: number | null;
  commonErrorRate?: number | null;
  vocabComplexity?: number | null;
}

export interface AiTextDetectionInput {
  text: string;
  childAgeYears: number;
  timeTakenMs: number;
  exercisePromptLength: number;
  writingProfile?: ChildWritingProfileSnapshot;
}

export interface AiTextSignal {
  name: string;
  value: number;
  weight: number;
  contribution: number;
}

export interface AiTextDetectionResult {
  suspicionScore: number;
  signals: AiTextSignal[];
  detectorName: string;
  detectorVersion: string;
}

/** Interface pluggable : un futur détecteur externe (API tierce) implémente cette même
 * interface — aucun site d'appel à changer, seule la variable d'env
 * AI_TEXT_DETECTOR_PROVIDER change (voir index.ts). */
export interface AiTextDetector {
  name: string;
  version: string;
  detect(input: AiTextDetectionInput): Promise<AiTextDetectionResult>;
}
