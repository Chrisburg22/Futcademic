/**
 * Worker de dictado local.
 *
 * Whisper Base corre aquí dentro para que la descarga y la inferencia no
 * congelen la interfaz. El audio nunca sale del dispositivo: solo se envían
 * los pesos del modelo desde Hugging Face la primera vez y quedan en la caché
 * del navegador.
 */
import { env, pipeline, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';
import {
  DICTATION_LANGUAGE,
  DICTATION_MODEL,
  type SpeechWorkerRequest,
  type SpeechWorkerResponse,
} from '../lib/speechProtocol';

// En un worker `self` no es `Window`, pero el lib de DOM no trae el tipo de
// `DedicatedWorkerGlobalScope` sin cambiar el tsconfig global del proyecto.
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<SpeechWorkerRequest>) => void) | null;
  postMessage: (message: SpeechWorkerResponse, transfer?: Transferable[]) => void;
};

env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriberPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null;
let modelReady = false;

function post(message: SpeechWorkerResponse) {
  scope.postMessage(message);
}

function loadTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (!transcriberPromise) {
    transcriberPromise = pipeline('automatic-speech-recognition', DICTATION_MODEL, {
      // WASM funciona en todos los navegadores; WebGPU aún no está disponible
      // de forma consistente (Brave incluido). q8 es el dtype por defecto en
      // WASM y deja el modelo en ~76 MB; con el runtime son ~100 MB.
      device: 'wasm',
      dtype: 'q8',
      progress_callback: (info) => {
        // `progress_total` agrega todos los archivos (encoder, decoder,
        // tokenizer…), que es lo que el usuario percibe como la descarga.
        if (info.status === 'progress_total') {
          const progress = Number.isFinite(info.progress)
            ? Math.min(100, Math.max(0, Math.round(info.progress)))
            : 0;
          post({ type: 'progress', progress });
        }
      },
    })
      .then((transcriber) => {
        modelReady = true;
        post({ type: 'ready' });
        return transcriber;
      })
      .catch((error: unknown) => {
        // Sin esto un fallo de red dejaría la promesa rechazada cacheada y el
        // siguiente intento fallaría al instante sin volver a descargar.
        transcriberPromise = null;
        modelReady = false;
        console.error('[dictado] no se pudo cargar el modelo', error);
        throw error;
      });
  }
  return transcriberPromise;
}

scope.onmessage = (event) => {
  const message = event.data;
  if (!message || typeof message !== 'object') return;

  if (message.type === 'warmup') {
    // Se lanza mientras el usuario habla: si termina antes, la transcripción
    // arranca sin esperar la descarga.
    void loadTranscriber().catch(() => post({ type: 'error', stage: 'model' }));
    return;
  }

  if (message.type === 'transcribe') {
    const { id, audio } = message;
    void (async () => {
      try {
        // El aviso de "transcribiendo" sale solo cuando el modelo ya está
        // cargado; si aún se está descargando, la barra de progreso manda.
        const transcriber = await loadTranscriber();
        post({ type: 'transcribing', id });
        const output = await transcriber(audio, {
          language: DICTATION_LANGUAGE,
          task: 'transcribe',
          // Whisper trabaja en ventanas de 30 s; el pipeline parte audios más
          // largos y cose los bordes con este solape.
          chunk_length_s: 30,
          stride_length_s: 5,
        });
        post({ type: 'result', id, text: output.text ?? '' });
      } catch (error) {
        console.error('[dictado] fallo al transcribir', error);
        // Si el fallo fue al descargar el modelo, el mensaje debe hablar de la
        // descarga y no de una transcripción imposible.
        post({ type: 'error', id, stage: modelReady ? 'transcribe' : 'model' });
      }
    })();
  }
};
