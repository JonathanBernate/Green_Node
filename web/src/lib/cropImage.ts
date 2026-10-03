import type { CropBox } from './targetFrame';

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('No se pudo leer la imagen'));
    i.src = src;
  });
}

/** Recorta un cuadrado (en píxeles de la imagen original) y lo devuelve como JPEG, con lado máximo `maxSide`. */
export async function cropImage(src: string, crop: CropBox, maxSide = 800): Promise<string> {
  const img = await loadImage(src);
  const out = Math.max(1, Math.min(Math.round(crop.side), maxSide));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = out;
  canvas.getContext('2d')?.drawImage(img, crop.sx, crop.sy, crop.side, crop.side, 0, 0, out, out);
  return canvas.toDataURL('image/jpeg', 0.92);
}

/** Cuadrado centrado que ocupa `ratio` del lado menor: punto de partida del recorte. */
export function defaultCrop(nw: number, nh: number, ratio = 0.8): CropBox {
  const side = Math.min(nw, nh) * ratio;
  return { sx: (nw - side) / 2, sy: (nh - side) / 2, side };
}

/** Mantiene el cuadrado dentro de la imagen. */
export function clampCrop(c: CropBox, nw: number, nh: number): CropBox {
  const side = Math.max(16, Math.min(c.side, nw, nh));
  return { side, sx: Math.min(Math.max(0, c.sx), nw - side), sy: Math.min(Math.max(0, c.sy), nh - side) };
}

/** Cambia el lado manteniendo el centro. */
export function resizeCrop(c: CropBox, side: number, nw: number, nh: number): CropBox {
  const cx = c.sx + c.side / 2;
  const cy = c.sy + c.side / 2;
  return clampCrop({ side, sx: cx - side / 2, sy: cy - side / 2 }, nw, nh);
}
