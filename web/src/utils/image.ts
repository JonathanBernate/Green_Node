export const AVATAR_SIZE = 256;
export const AVATAR_MAX_INPUT_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/** Mensaje de error si el archivo no sirve como foto de perfil; null si es válido. */
export function validateAvatarFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!ACCEPTED.includes(file.type)) return 'Usa una imagen JPG, PNG o WebP.';
  if (file.size > AVATAR_MAX_INPUT_BYTES) return 'La imagen supera 8 MB. Elige una más liviana.';
  return null;
}

/** Recorta al centro en cuadrado y reduce a 256 px (JPEG): la foto final pesa unos 20 KB. */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Tu navegador no puede procesar imágenes.');
    ctx.fillStyle = '#fff'; // los PNG transparentes quedan sobre blanco al pasar a JPEG
    ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
