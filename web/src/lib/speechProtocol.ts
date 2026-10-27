/**
 * Contrato entre el composer y el worker que ejecuta Whisper.
 *
 * El audio viaja como PCM mono a 16 kHz: es el formato que espera el modelo y
 * evita mandar un Blob comprimido que el worker tendría que volver a decodificar.
 */

export const DICTATION_MODEL = 'onnx-community/whisper-base';
export const DICTATION_SAMPLE_RATE = 16_000;
export const DICTATION_LANGUAGE = 'spanish';

export type SpeechWorkerRequest =
  | { type: 'warmup' }
  | { type: 'transcribe'; id: number; audio: Float32Array<ArrayBuffer> };

export type SpeechWorkerResponse =
  /** El modelo ya está descargado e inicializado. */
  | { type: 'ready' }
  /** Descarga/arranque en curso; `progress` va de 0 a 100. */
  | { type: 'progress'; progress: number }
  /** El modelo está listo y empieza la inferencia del clip. */
  | { type: 'transcribing'; id: number }
  | { type: 'result'; id: number; text: string }
  | { type: 'error'; id?: number; stage: 'model' | 'transcribe' };
