/**
 * Utilidades del dictado local.
 *
 * Ya no se usa la Web Speech API: en Brave el servicio de Google está
 * desactivado y devuelve `network` aunque haya internet. Ahora el navegador
 * graba el audio, lo convierte a PCM mono de 16 kHz y Whisper lo transcribe en
 * un worker local (ver `localSpeech.ts`).
 */
import { DICTATION_SAMPLE_RATE } from './speechProtocol';

/** Tope de grabación: más allá de dos minutos la memoria y la espera crecen de más. */
export const MAX_RECORDING_MS = 120_000;

/** Silencio aproximado por debajo del cual no vale la pena ejecutar el modelo. */
export const MIN_AUDIO_RMS = 0.0025;

/** Un clip más corto que esto suele ser un toque accidental en el micrófono. */
export const MIN_AUDIO_SECONDS = 0.5;

export const DICTATION_MODEL_ERROR =
  'No se pudo cargar el dictado. La primera vez descarga ~100 MB (modelo y motor); revisa tu conexión e intenta de nuevo.';
export const DICTATION_TRANSCRIBE_ERROR = 'No se pudo transcribir el audio. Intenta de nuevo.';
export const DICTATION_EMPTY_ERROR =
  'No se escuchó nada. Habla más cerca del micrófono e intenta de nuevo.';
export const DICTATION_SHORT_ERROR = 'La grabación fue demasiado corta. Intenta de nuevo.';
export const DICTATION_DECODE_ERROR = 'No se pudo leer el audio grabado. Intenta de nuevo.';
export const DICTATION_NO_AUDIO_ERROR = 'No se grabó audio. Revisa el micrófono e intenta de nuevo.';
export const DICTATION_UNKNOWN_ERROR = 'No se pudo dictar. Intenta de nuevo.';

type AudioContextCtor = new (options?: AudioContextOptions) => AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

/**
 * Dictar necesita micrófono, grabador, AudioContext para decodificar y un
 * worker para no congelar la interfaz. Si falta algo, el micrófono se oculta
 * en vez de mostrar un botón que va a fallar.
 */
export function isLocalDictationSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    typeof window.Worker !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    getAudioContextCtor() !== null
  );
}

/** Primer formato que el navegador puede grabar; `undefined` deja que elija. */
export function pickAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  if (typeof MediaRecorder.isTypeSupported !== 'function') return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

/** Traduce los errores de `getUserMedia` a algo accionable. */
export function microphoneErrorMessage(error: unknown): string {
  const name =
    typeof error === 'object' && error !== null && 'name' in error
      ? String((error as { name: unknown }).name)
      : '';

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'Permite el micrófono para dictar.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No encontramos un micrófono conectado.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'El micrófono está en uso por otra aplicación.';
    case 'AbortError':
      return 'El navegador canceló el acceso al micrófono.';
    default:
      return 'No se pudo acceder al micrófono. Intenta de nuevo.';
  }
}

/** Decodifica el Blob grabado y lo deja en el formato que espera Whisper. */
export async function decodeRecording(blob: Blob): Promise<Float32Array<ArrayBuffer>> {
  const AudioCtor = getAudioContextCtor();
  if (!AudioCtor) throw new Error('unsupported');

  const context = new AudioCtor();
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    return toMono16k(buffer);
  } finally {
    try {
      void context.close().catch(() => {
        // Cerrar un contexto ya cerrado no debe tapar el error real.
      });
    } catch {
      // Algunos navegadores no implementan close() en contextos suspendidos.
    }
  }
}

/**
 * Mezcla los canales a mono y remuestrea a 16 kHz con interpolación lineal.
 * Se hace a mano para no depender de `OfflineAudioContext`, que en Safari
 * ignora `sampleRate` en algunos contextos.
 */
function toMono16k(buffer: AudioBuffer): Float32Array<ArrayBuffer> {
  const channels = Math.max(1, buffer.numberOfChannels);
  const input: Float32Array[] = [];
  for (let channel = 0; channel < channels; channel += 1) {
    input.push(buffer.getChannelData(channel));
  }

  const targetLength = Math.max(
    1,
    Math.round((buffer.length / Math.max(1, buffer.sampleRate)) * DICTATION_SAMPLE_RATE)
  );
  const output = new Float32Array(targetLength);
  const lastInput = buffer.length - 1;
  if (lastInput < 0) return output;

  const ratio = buffer.sampleRate / DICTATION_SAMPLE_RATE;
  for (let i = 0; i < targetLength; i += 1) {
    const position = i * ratio;
    const left = Math.min(Math.floor(position), lastInput);
    const right = Math.min(left + 1, lastInput);
    const mix = position - left;

    let sample = 0;
    for (let channel = 0; channel < channels; channel += 1) {
      const data = input[channel];
      sample += data[left] * (1 - mix) + data[right] * mix;
    }
    output[i] = sample / channels;
  }
  return output;
}

/** Nivel y duración del clip para descartar silencios sin cargar el modelo. */
export function analyzeAudio(audio: Float32Array): { durationS: number; rms: number } {
  if (audio.length === 0) return { durationS: 0, rms: 0 };
  let sum = 0;
  for (let i = 0; i < audio.length; i += 1) {
    sum += audio[i] * audio[i];
  }
  return {
    durationS: audio.length / DICTATION_SAMPLE_RATE,
    rms: Math.sqrt(sum / audio.length),
  };
}

const NOISE_TAG =
  /\[(?:música|musica|aplausos|risas|silencio|inaudible|ruido|música de fondo|blank_audio|music|noise|foreign)\]/gi;

/** Quita marcas de no-habla y normaliza espacios antes de insertar el texto. */
export function cleanTranscript(text: string): string {
  return text
    .replace(NOISE_TAG, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Une dos fragmentos sin duplicar el espacio que ya trae el dictado. */
export function joinTranscript(base: string, chunk: string): string {
  const left = base.trimEnd();
  const right = chunk.trimStart();
  if (!left) return right;
  if (!right) return left;
  return `${left} ${right}`;
}
