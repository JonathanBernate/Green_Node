/** Fracción del lado menor de la cámara que ocupa el marco de enfoque. */
export const TARGET_RATIO = 0.62;

export interface CropBox {
  sx: number;
  sy: number;
  /** Lado del cuadrado, en píxeles del video. */
  side: number;
}

/**
 * Región del video (en sus píxeles) que queda dentro del marco de enfoque.
 * El <video> usa object-fit: cover y el marco va centrado, así que el recorte es un cuadrado centrado
 * cuyo tamaño en pantalla es `ratio × lado menor del contenedor`.
 */
export function targetCrop(vw: number, vh: number, cw: number, ch: number, ratio = TARGET_RATIO): CropBox {
  const shorter = Math.min(vw, vh);
  const scale = cw > 0 && ch > 0 ? Math.max(cw / vw, ch / vh) : 0;
  const side = scale > 0 ? Math.min(shorter, (Math.min(cw, ch) * ratio) / scale) : shorter * ratio;
  return { sx: (vw - side) / 2, sy: (vh - side) / 2, side };
}
