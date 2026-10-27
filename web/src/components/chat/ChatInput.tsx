import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActionIcon, Group, Paper, Text, Textarea, Tooltip } from '@mantine/core';
import { IconMicrophone, IconPlayerStop, IconSend } from '@tabler/icons-react';
import {
  getSpeechRecognition,
  joinTranscript,
  type SpeechRecognitionLike,
} from '../../lib/speech';
import classes from './chat.module.css';

/** Mensaje humano para los errores que devuelve el reconocimiento de voz. */
function speechErrorMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Permite el micrófono para dictar.';
    case 'audio-capture':
      return 'No encontramos un micrófono conectado.';
    case 'no-speech':
      return 'No se escuchó nada. Intenta de nuevo.';
    case 'network':
      return 'El dictado necesita conexión a internet.';
    default:
      return 'No se pudo dictar. Intenta de nuevo.';
  }
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
  const [listening, setListening] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // El reconocimiento vive fuera de React; los refs evitan que los callbacks
  // del navegador se queden con una versión vieja del texto.
  const valueRef = useRef('');
  const baseRef = useRef('');
  const finalRef = useRef('');
  const interimRef = useRef('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mountedRef = useRef(true);
  const composerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastWidthRef = useRef(0);

  // La API puede no existir (Firefox, Safari viejo): se comprueba tras montar
  // para no romper la hidratación.
  useEffect(() => {
    // StrictMode monta, desmonta y vuelve a montar: el ref debe recuperarse.
    mountedRef.current = true;
    setVoiceReady(getSpeechRecognition() !== null);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const writeValue = useCallback((next: string) => {
    valueRef.current = next;
    setValue(next);
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

  /** Corta el dictado sin dejar que el `onend` pise el texto ya enviado. */
  const resetRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.abort();
    recognitionRef.current = null;
    interimRef.current = '';
    setListening(false);
  }, []);

  useEffect(() => () => resetRecognition(), [resetRecognition]);

  // Si el composer se bloquea (confirmación pendiente) o empieza una
  // respuesta, el micrófono no debe seguir escuchando.
  useEffect(() => {
    if (disabled || streaming) resetRecognition();
  }, [disabled, streaming, resetRecognition]);

  const startDictation = () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;

    setVoiceError(null);
    baseRef.current = valueRef.current;
    finalRef.current = '';
    interimRef.current = '';

    const recognition = new Recognition();
    recognition.lang = 'es-MX';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalChunk += text;
        else interim += text;
      }

      if (finalChunk) {
        finalRef.current = joinTranscript(finalRef.current, finalChunk);
      }
      interimRef.current = interim;

      writeValue(
        joinTranscript(baseRef.current, joinTranscript(finalRef.current, interimRef.current))
      );
    };

    recognition.onerror = (event) => {
      if (!mountedRef.current) return;
      setVoiceError(speechErrorMessage(event.error));
    };

    recognition.onend = () => {
      if (!mountedRef.current) return;
      // Algunos navegadores cierran sin marcar el último fragmento como final.
      if (interimRef.current) {
        finalRef.current = joinTranscript(finalRef.current, interimRef.current);
        interimRef.current = '';
        writeValue(joinTranscript(baseRef.current, finalRef.current));
      }
      recognitionRef.current = null;
      setListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      setVoiceError('No se pudo iniciar el dictado. Intenta de nuevo.');
    }
  };

  const stopDictation = () => {
    // `stop` deja que el navegador entregue el último resultado; el `onend`
    // limpia el estado y apaga el micrófono.
    recognitionRef.current?.stop();
  };

  const submit = () => {
    const text = value.trim();
    // Mientras el asistente responde se puede escribir, pero no enviar:
    // el turno siguiente espera a que termine o se detenga.
    if (!text || disabled || streaming) return;
    resetRecognition();
    onSend(text);
    writeValue('');
    setVoiceError(null);
  };

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
          {listening
            ? 'Escuchando… vuelve a pulsar el micrófono para terminar.'
            : streaming
              ? 'Puedes escribir; envía cuando termine.'
              : 'Enter envía · Shift + Enter salta de línea'}
        </Text>
        <Group gap={6} wrap="nowrap" ml="auto">
          {voiceReady && !streaming && !disabled && (
            <Tooltip
              label={listening ? 'Detener dictado' : 'Dictar por voz (es-MX)'}
              withArrow
            >
              <ActionIcon
                size={38}
                radius="md"
                variant={listening ? 'filled' : 'light'}
                color={listening ? 'red' : 'gray'}
                onClick={listening ? stopDictation : startDictation}
                aria-label={listening ? 'Detener dictado' : 'Dictar mensaje'}
                aria-pressed={listening}
                className={listening ? classes.listening : undefined}
              >
                <IconMicrophone size={18} />
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
      {voiceError && (
        <Text size="xs" c="red" px="sm" pb={6} role="alert">
          {voiceError}
        </Text>
      )}
    </Paper>
  );
}
