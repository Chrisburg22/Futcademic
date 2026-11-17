/** Tamaño del lado del JPEG que se sube; suficiente para avatares grandes. */
export const TAMANO_SALIDA = 512;
export const CALIDAD_SALIDA = 0.85;
export const TIPOS_IMAGEN_ACEPTADOS = 'image/jpeg,image/png,image/webp';
export const MAX_BYTES_ORIGEN = 15 * 1024 * 1024;

export interface AreaRecorte {
  x: number;
  y: number;
  width: number;
  height: number;
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    img.src = src;
  });
}

/**
 * Recorta y reescala en el navegador: lo que llega al backend es siempre un
 * JPEG de 512 px, así que una foto de celular de 5 MB se queda en ~80 KB y los
 * listados no se vuelven lentos.
 */
export async function recortarImagen(
  src: string,
  area: AreaRecorte,
  opciones: { ancho?: number; alto?: number; nombre?: string } = {},
): Promise<File> {
  const ancho = opciones.ancho ?? TAMANO_SALIDA;
  const alto = opciones.alto ?? ancho;

  const imagen = await cargarImagen(src);
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no permite procesar la imagen.');

  // Fondo blanco: el JPEG no tiene transparencia y un PNG recortado saldría negro.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ancho, alto);
  ctx.drawImage(
    imagen,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    ancho,
    alto,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', CALIDAD_SALIDA),
  );
  if (!blob) throw new Error('No se pudo procesar la imagen.');

  return new File([blob], opciones.nombre || 'foto.jpg', { type: 'image/jpeg' });
}
