/**
 * Captura del evento de instalación de la PWA.
 *
 * El navegador dispara `beforeinstallprompt` muy pronto, normalmente antes de
 * que React monte nada. Por eso el listener se registra aquí, a nivel de
 * módulo (importado desde main.tsx), y no dentro de un componente: si se
 * espera al primer render, el evento ya pasó y el botón de instalar no
 * aparece nunca.
 */

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Sin preventDefault, Chrome enseña su propio mini-banner y el evento
    // deja de estar disponible para nosotros.
    e.preventDefault();
    deferredPrompt = e as InstallPromptEvent;
    emit();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emit();
  });
}

export function subscribeToInstallPrompt(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getInstallPrompt() {
  return deferredPrompt;
}

/** El navegador solo deja usar el evento una vez, así que se descarta tras llamarlo. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const evt = deferredPrompt;
  if (!evt) return 'unavailable';

  await evt.prompt();
  const { outcome } = await evt.userChoice;
  deferredPrompt = null;
  emit();
  return outcome;
}

/** La app ya está instalada y abierta desde el icono. */
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari en iOS no implementa display-mode y usa esto.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** ¿Es un navegador de escritorio que instala PWAs pero sin `beforeinstallprompt`? */
export function isDesktopInstallable() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  if (/android|iphone|ipad|ipod/i.test(ua)) return false;

  // Chromium de escritorio (Chrome, Edge, Brave, Opera, Vivaldi) sabe instalar,
  // pero Brave y algunas variantes no disparan el evento: solo queda el menú.
  const chromium = /Chrome|Chromium|Edg|OPR/i.test(ua);
  // Safari en macOS 14+ instala con "Añadir al Dock".
  const safari = /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua);
  return chromium || safari;
}

/** El navegador es Safari (los pasos manuales cambian respecto a Chromium). */
export function isSafari() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua);
}

/** iOS no soporta `beforeinstallprompt`: hay que explicarle al usuario los pasos. */
export function isIos() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ se presenta como Mac; se distingue por el táctil.
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  );
}
