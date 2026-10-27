/**
 * Tipos mínimos de la Web Speech API.
 *
 * `SpeechRecognition` todavía no forma parte de `lib.dom.d.ts` y Chrome solo
 * la expone con prefijo, así que no queda otra que declarar la parte que
 * usamos. Dictar es una mejora progresiva: si el navegador no la trae, el
 * micrófono simplemente no aparece.
 */

export type SpeechResult = {
  isFinal: boolean;
  0: { transcript: string };
};

export type SpeechResultList = {
  length: number;
  [index: number]: SpeechResult;
};

export type SpeechResultEvent = {
  resultIndex: number;
  results: SpeechResultList;
};

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

/** Une dos fragmentos sin duplicar el espacio que ya trae el dictado. */
export function joinTranscript(base: string, chunk: string): string {
  const left = base.trimEnd();
  const right = chunk.trimStart();
  if (!left) return right;
  if (!right) return left;
  return `${left} ${right}`;
}
