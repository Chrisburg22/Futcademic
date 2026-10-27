import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActionIcon, Box, Group, Paper, Progress, Text, Textarea, Tooltip } from '@mantine/core';
import { IconMicrophone, IconPlayerStop, IconSend } from '@tabler/icons-react';
import {
  analyzeAudio,
  cleanTranscript,
  DICTATION_DECODE_ERROR,
  DICTATION_EMPTY_ERROR,
  DICTATION_MODEL_ERROR,
  DICTATION_NO_AUDIO_ERROR,
  DICTATION_SHORT_ERROR,
  DICTATION_TRANSCRIBE_ERROR,
  DICTATION_UNKNOWN_ERROR,
  decodeRecording,
  isLocalDictationSupported,
  joinTranscript,
  MAX_RECORDING_MS,
  MIN_AUDIO_RMS,
  MIN_AUDIO_SECONDS,
  microphoneErrorMessage,
  pickAudioMimeType,
} from '../../lib/speech';
import {
  createLocalTranscriber,
  DICTATION_ERROR_MODEL,
  DICTATION_ERROR_WORKER,
  type DictationProgress,
  type LocalTranscriber,
} from '../../lib/localSpeech';
import classes from './chat.module.css';

type DictationStatus = 'idle' | 'requesting' | 'recording' | 'transcribing';

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function ChatInput({
  onSend,
  onStop,
  disabled,
  streaming,
  placeholder,
  autoFocus,
}: {
  onSend: (text: string) => void;
  /** Detiene el turno en curso (aborta el stream y las herramientas). */
  onStop?: () => void;
  /** Bloquea el envío (p. ej. hay una confirmación pendiente). */
  disabled?: boolean;
  streaming?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState('');
  const [dictation, setDictation] = useState<DictationStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [modelProgress, setModelProgress] = useState<number | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [dictationSupported, setDictationSupported] = useState(false);

  // El valor y el estado viven también en refs: los callbacks del grabador y
  // del worker se crean una sola vez y no deben quedarse con datos viejos.
  const valueRef = useRef('');
  const dictationRef = useRef<DictationStatus>('idle');
  const transcriberRef = useRef<LocalTranscriber | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const limitRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  /** Invalida resultados que llegan después de cancelar o desmontar. */
  const tokenRef = useRef(0);
  const mountedRef = useRef(true);
  const composerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastWidthRef = useRef(0);

  const writeValue = useCallback((next: string) => {
    valueRef.current = next;
    setValue(next);
  }, []);

  const changeDictation = useCallback((next: DictationStatus) => {
    dictationRef.current = next;
    setDictation(next);
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (limitRef.current !== null) {
      window.clearTimeout(limitRef.current);
      limitRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  /**
   * Auto-alto propio en vez de `autosize` de Mantine.
   *
   * El autosize de la librería mide una sola vez con el ancho del momento: al
   * pasar de escritorio a móvil el campo se quedaba con seis filas vacías.
   * Aquí se recalcula con cada cambio de texto y cuando cambia el ancho.
   */
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const styles = window.getComputedStyle(el);
    const lineHeight = parseFloat(styles.lineHeight) || 24;
    const padding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    const border = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
    const maxHeight = lineHeight * 6 + padding + border;

    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight + border, maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight + border > maxHeight ? 'auto' : 'hidden';
  }, []);

  useLayoutEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[0]?.contentRect.width ?? 0);
      // Solo el ancho obliga a recalcular; el alto cambia justo por esto.
      if (!width || width === lastWidthRef.current) return;
      lastWidthRef.current = width;
      resizeTextarea();
    });
    observer.observe(composer);
    return () => observer.disconnect();
  }, [resizeTextarea]);

  const handleProgress = useCallback((update: DictationProgress) => {
    if (!mountedRef.current) return;
    setModelProgress(update.ready ? null : update.progress);
  }, []);

  const cancelDictation = useCallback(() => {
    tokenRef.current += 1;
    clearTimers();

    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        // El grabador ya estaba cerrado; no hay nada que rescatar.
      }
    }

    stopStream();
    chunksRef.current = [];
    changeDictation('idle');
    setElapsed(0);
    setModelProgress(null);
  }, [changeDictation, clearTimers, stopStream]);

  const finishRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    const token = tokenRef.current;
    const chunks = chunksRef.current;
    const mimeType = recorder?.mimeType || chunks[0]?.type || 'audio/webm';

    recorderRef.current = null;
    chunksRef.current = [];
    clearTimers();
    // El micrófono se apaga en cuanto tenemos los datos.
    stopStream();

    if (chunks.length === 0) {
      if (token === tokenRef.current && mountedRef.current) {
        setVoiceError(DICTATION_NO_AUDIO_ERROR);
        changeDictation('idle');
      }
      return;
    }

    if (token !== tokenRef.current || !mountedRef.current) return;

    changeDictation('transcribing');

    let audio: Float32Array<ArrayBuffer>;
    try {
      audio = await decodeRecording(new Blob(chunks, { type: mimeType }));
    } catch (error) {
      console.error('[dictado] no se pudo decodificar el audio', error);
      if (token === tokenRef.current && mountedRef.current) {
        setVoiceError(DICTATION_DECODE_ERROR);
        changeDictation('idle');
        setModelProgress(null);
      }
      return;
    }

    if (token !== tokenRef.current || !mountedRef.current) return;

    const { durationS, rms } = analyzeAudio(audio);
    if (durationS < MIN_AUDIO_SECONDS) {
      setVoiceError(DICTATION_SHORT_ERROR);
      changeDictation('idle');
      setModelProgress(null);
      return;
    }
    if (rms < MIN_AUDIO_RMS) {
      setVoiceError(DICTATION_EMPTY_ERROR);
      changeDictation('idle');
      setModelProgress(null);
      return;
    }

    try {
      const transcriber =
        transcriberRef.current ?? createLocalTranscriber({ onProgress: handleProgress });
      transcriberRef.current = transcriber;

      const text = cleanTranscript(await transcriber.transcribe(audio));
      if (token !== tokenRef.current || !mountedRef.current) return;
      if (!text) {
        setVoiceError(DICTATION_EMPTY_ERROR);
        changeDictation('idle');
        setModelProgress(null);
        return;
      }

      writeValue(joinTranscript(valueRef.current, text));
      setVoiceError(null);
      setVoiceNotice(null);
      setModelProgress(null);
      changeDictation('idle');
    } catch (error) {
      if (token !== tokenRef.current || !mountedRef.current) return;
      const code = error instanceof Error ? error.message : '';
      setVoiceError(
        code === DICTATION_ERROR_MODEL || code === DICTATION_ERROR_WORKER
          ? DICTATION_MODEL_ERROR
          : DICTATION_TRANSCRIBE_ERROR
      );
      setModelProgress(null);
      changeDictation('idle');
    }
  }, [changeDictation, clearTimers, handleProgress, stopStream, writeValue]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    clearTimers();
    changeDictation('transcribing');
    try {
      // `stop` deja que el grabador entregue el último fragmento; `onstop`
      // decodifica y transcribe.
      recorder.stop();
    } catch (error) {
      console.error('[dictado] no se pudo detener la grabación', error);
      setVoiceError(DICTATION_UNKNOWN_ERROR);
      cancelDictation();
    }
  }, [cancelDictation, changeDictation, clearTimers]);

  const startDictation = useCallback(async () => {
    if (dictationRef.current !== 'idle') return;

    setVoiceError(null);
    setVoiceNotice(null);
    setModelProgress(null);
    tokenRef.current += 1;
    const token = tokenRef.current;
    changeDictation('requesting');

    try {
      const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices?.getUserMedia) {
        setVoiceError('Este navegador no permite grabar audio.');
        changeDictation('idle');
        return;
      }

      const stream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (token !== tokenRef.current || !mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      const mimeType = pickAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        void finishRecording();
      };
      recorder.onerror = () => {
        if (token !== tokenRef.current) return;
        setVoiceError('La grabación se interrumpió. Intenta de nuevo.');
        cancelDictation();
      };

      recorder.start(1000);
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsed(0);
      changeDictation('recording');

      timerRef.current = window.setInterval(() => {
        setElapsed(Date.now() - startedAtRef.current);
      }, 250);
      limitRef.current = window.setTimeout(() => {
        if (dictationRef.current !== 'recording') return;
        setVoiceNotice(
          'La grabación llegó al límite de 2 minutos; se transcribirá lo que alcanzó a grabarse.'
        );
        stopRecording();
      }, MAX_RECORDING_MS);

      // La descarga del modelo avanza mientras el usuario habla; si ya estaba
      // en caché, la transcripción arranca sin esperas.
      try {
        const transcriber =
          transcriberRef.current ?? createLocalTranscriber({ onProgress: handleProgress });
        transcriberRef.current = transcriber;
        transcriber.warmup();
      } catch (error) {
        console.error('[dictado] no se pudo preparar el modelo', error);
      }
    } catch (error) {
      if (token !== tokenRef.current || !mountedRef.current) return;
      console.error('[dictado] no se pudo acceder al micrófono', error);
      stopStream();
      setVoiceError(microphoneErrorMessage(error));
      changeDictation('idle');
    }
  }, [cancelDictation, changeDictation, finishRecording, handleProgress, stopRecording, stopStream]);

  // StrictMode monta, desmonta y vuelve a montar: el ref debe recuperarse.
  useEffect(() => {
    mountedRef.current = true;
    setDictationSupported(isLocalDictationSupported());
    return () => {
      mountedRef.current = false;
      cancelDictation();
      transcriberRef.current?.terminate();
      transcriberRef.current = null;
    };
  }, [cancelDictation]);

  // Si el composer se bloquea (confirmación pendiente) o empieza una
  // respuesta, el micrófono no debe seguir grabando.
  useEffect(() => {
    if (!disabled && !streaming) return;
    if (dictationRef.current === 'recording' || dictationRef.current === 'requesting') {
      cancelDictation();
    }
  }, [disabled, streaming, cancelDictation]);

  const submit = () => {
    const text = value.trim();
    // Mientras el asistente responde se puede escribir, pero no enviar:
    // el turno siguiente espera a que termine o se detenga.
    if (!text || disabled || streaming) return;
    if (dictationRef.current !== 'idle') cancelDictation();
    onSend(text);
    writeValue('');
    setVoiceError(null);
    setVoiceNotice(null);
  };

  const dictationStatus =
    dictation === 'requesting'
      ? 'Pidiendo permiso para el micrófono…'
      : dictation === 'recording'
        ? `Grabando ${formatElapsed(elapsed)} · pulsa el micrófono para terminar${
            modelProgress !== null ? ` · descargando modelo ${modelProgress} %` : ''
          }`
        : dictation === 'transcribing'
          ? modelProgress !== null
            ? `Preparando el dictado… ${modelProgress} % (la primera vez descarga ~100 MB)`
            : 'Transcribiendo…'
          : null;

  return (
    <Paper withBorder radius="lg" className={classes.composer} w="100%" ref={composerRef}>
      <Textarea
        ref={textareaRef}
        variant="unstyled"
        value={value}
        onChange={(e) => {
          writeValue(e.currentTarget.value);
          if (voiceError) setVoiceError(null);
        }}
        placeholder={placeholder ?? 'Escribe una orden o pregunta…'}
        aria-label="Mensaje para el asistente"
        rows={1}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="send"
        styles={{ input: { padding: '9px 12px 2px' } }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Group gap="xs" wrap="nowrap" px="sm" pb={5} pt={0}>
        <Text size="xs" c="dimmed" visibleFrom="sm" truncate>
          {streaming
            ? 'Puedes escribir; envía cuando termine.'
            : 'Enter envía · Shift + Enter salta de línea'}
        </Text>
        <Group gap={6} wrap="nowrap" ml="auto">
          {dictationSupported && !streaming && !disabled && (
            <Tooltip
              label={
                dictation === 'recording'
                  ? 'Detener grabación'
                  : dictation === 'transcribing'
                    ? 'Transcribiendo…'
                    : 'Dictar por voz (local, es-MX)'
              }
              withArrow
            >
              <ActionIcon
                size={38}
                radius="md"
                variant={dictation === 'recording' ? 'filled' : 'light'}
                color={dictation === 'recording' ? 'red' : 'gray'}
                onClick={dictation === 'recording' ? stopRecording : () => void startDictation()}
                disabled={dictation === 'requesting' || dictation === 'transcribing'}
                loading={dictation === 'requesting' || dictation === 'transcribing'}
                aria-label={dictation === 'recording' ? 'Detener dictado' : 'Dictar mensaje'}
                aria-pressed={dictation === 'recording'}
                className={dictation === 'recording' ? classes.listening : undefined}
              >
                {dictation === 'recording' ? (
                  <IconPlayerStop size={18} />
                ) : (
                  <IconMicrophone size={18} />
                )}
              </ActionIcon>
            </Tooltip>
          )}
          {streaming ? (
            <Tooltip label="Detener respuesta" withArrow>
              <ActionIcon
                size={38}
                radius="md"
                variant="filled"
                color="red"
                onClick={onStop}
                aria-label="Detener respuesta"
              >
                <IconPlayerStop size={18} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Tooltip label="Enviar (Enter)" withArrow>
              <ActionIcon
                size={38}
                radius="md"
                variant="filled"
                onClick={submit}
                disabled={disabled || !value.trim()}
                aria-label="Enviar mensaje"
              >
                <IconSend size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>
      {dictation !== 'idle' && (
        <Box px="sm" pb={6}>
          {modelProgress !== null && (
            <Progress
              value={modelProgress}
              size={3}
              radius="xl"
              color="futcamedic"
              mb={4}
              aria-label="Descarga del modelo de dictado"
            />
          )}
          <Text size="xs" c="dimmed" role="status" aria-live="polite">
            {dictationStatus}
          </Text>
        </Box>
      )}
      {voiceNotice && !voiceError && (
        <Text size="xs" c="dimmed" px="sm" pb={6} role="status">
          {voiceNotice}
        </Text>
      )}
      {voiceError && (
        <Text size="xs" c="red" px="sm" pb={6} role="alert">
          {voiceError}
        </Text>
      )}
    </Paper>
  );
}
