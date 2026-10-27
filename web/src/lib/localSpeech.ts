import type { SpeechWorkerRequest, SpeechWorkerResponse } from './speechProtocol';

export type DictationProgress = {
  /** 0-100 mientras se descarga el modelo; null cuando ya está en memoria. */
  progress: number | null;
  ready: boolean;
};

export type LocalTranscriber = {
  /** Empieza a descargar/cargar el modelo sin bloquear la grabación. */
  warmup: () => void;
  transcribe: (audio: Float32Array<ArrayBuffer>) => Promise<string>;
  /** Libera el worker y la memoria del modelo. */
  terminate: () => void;
};

/** Códigos internos; la traducción a texto vive en `speech.ts`. */
export const DICTATION_ERROR_MODEL = 'model';
export const DICTATION_ERROR_TRANSCRIBE = 'transcribe';
export const DICTATION_ERROR_WORKER = 'worker';

type PendingRequest = {
  resolve: (text: string) => void;
  reject: (error: Error) => void;
};

/**
 * Envuelve el worker de Whisper con una API de promesas.
 *
 * El worker se crea en el primer uso (no al importar el módulo) para que la
 * página no pague el costo de Transformers.js si nadie dicta nada.
 */
export function createLocalTranscriber(
  { onProgress }: { onProgress?: (update: DictationProgress) => void } = {}
): LocalTranscriber {
  let worker: Worker | null = null;
  let ready = false;
  let warming = false;
  /** El modelo falló en este intento; no se reintenta hasta el próximo micrófono. */
  let failed = false;
  let nextId = 1;
  const pending = new Map<number, PendingRequest>();

  const notify = (progress: number | null) => {
    onProgress?.({ progress, ready });
  };

  const rejectAll = (code: string) => {
    if (pending.size === 0) return;
    const error = new Error(code);
    pending.forEach(({ reject }) => reject(error));
    pending.clear();
  };

  const disposeWorker = () => {
    worker?.terminate();
    worker = null;
    ready = false;
    warming = false;
  };

  const getWorker = (): Worker => {
    if (worker) return worker;

    const instance = new Worker(new URL('../workers/dictation.worker.ts', import.meta.url), {
      type: 'module',
      // Nombre estable: permite reconocer el worker en las pruebas e2e.
      name: 'futcademic-dictation',
    });

    instance.onmessage = (event: MessageEvent<SpeechWorkerResponse>) => {
      const message = event.data;
      switch (message.type) {
        case 'ready':
          ready = true;
          warming = false;
          failed = false;
          notify(null);
          break;
        case 'progress':
          notify(message.progress);
          break;
        case 'transcribing':
          notify(null);
          break;
        case 'result': {
          const request = pending.get(message.id);
          if (!request) return;
          pending.delete(message.id);
          request.resolve(message.text);
          break;
        }
        case 'error':
          if (message.stage === 'model') {
            // El modelo no se pudo descargar: se tira el worker para que el
            // siguiente intento vuelva a empezar de cero.
            failed = true;
            disposeWorker();
            rejectAll(DICTATION_ERROR_MODEL);
            notify(null);
          } else if (message.id !== undefined) {
            const request = pending.get(message.id);
            if (!request) return;
            pending.delete(message.id);
            request.reject(new Error(DICTATION_ERROR_TRANSCRIBE));
          }
          break;
      }
    };

    instance.onerror = (event) => {
      console.error('[dictado] el worker falló', event.message);
      // Si el modelo ya estaba cargado, el fallo es de la transcripción y no
      // de la descarga: no conviene culpar a la conexión.
      const code = ready ? DICTATION_ERROR_TRANSCRIBE : DICTATION_ERROR_WORKER;
      failed = !ready;
      disposeWorker();
      rejectAll(code);
      notify(null);
    };

    worker = instance;
    return instance;
  };

  return {
    warmup() {
      if (ready || warming) return;
      // Un fallo anterior no debe impedir que el usuario lo intente de nuevo:
      // al volver a pulsar el micrófono se descarta el error y se reintenta.
      failed = false;
      warming = true;
      try {
        getWorker().postMessage({ type: 'warmup' } satisfies SpeechWorkerRequest);
      } catch (error) {
        console.error('[dictado] no se pudo iniciar el worker', error);
        warming = false;
        disposeWorker();
      }
    },

    transcribe(audio) {
      return new Promise<string>((resolve, reject) => {
        if (failed) {
          reject(new Error(DICTATION_ERROR_MODEL));
          return;
        }

        let instance: Worker;
        try {
          instance = getWorker();
        } catch (error) {
          console.error('[dictado] no se pudo iniciar el worker', error);
          reject(new Error(DICTATION_ERROR_WORKER));
          return;
        }

        const id = nextId;
        nextId += 1;
        pending.set(id, { resolve, reject });

        try {
          const request: SpeechWorkerRequest = { type: 'transcribe', id, audio };
          // El PCM se transfiere sin copiarlo; el composer ya no lo necesita.
          instance.postMessage(request, [audio.buffer]);
        } catch (error) {
          console.error('[dictado] no se pudo enviar el audio al worker', error);
          pending.delete(id);
          reject(new Error(DICTATION_ERROR_WORKER));
        }
      });
    },

    terminate() {
      disposeWorker();
      rejectAll(DICTATION_ERROR_WORKER);
      notify(null);
    },
  };
}
