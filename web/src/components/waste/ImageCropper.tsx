import { KeyboardEvent, PointerEvent, useEffect, useRef, useState } from 'react';
import { clampCrop, defaultCrop, loadImage, resizeCrop } from '../../lib/cropImage';
import type { CropBox } from '../../lib/targetFrame';

interface Props {
  src: string;
  alt: string;
  /** null = analizar la imagen completa. */
  onChange: (crop: CropBox | null) => void;
}

/**
 * Selector de zona para imágenes de la galería: un cuadrado que se arrastra y cambia de tamaño
 * para dejar solo el residuo. Sin fondo ni objetos alrededor el modelo acierta más.
 */
export function ImageCropper({ src, alt, onChange }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<CropBox | null>(null);
  const [whole, setWhole] = useState(false);
  const drag = useRef<{ x: number; y: number; start: CropBox } | null>(null);

  useEffect(() => {
    let alive = true;
    setSize(null);
    setWhole(false);
    loadImage(src).then((img) => {
      if (!alive) return;
      const c = defaultCrop(img.naturalWidth, img.naturalHeight);
      setSize({ w: img.naturalWidth, h: img.naturalHeight });
      setCrop(c);
      onChange(c);
    }).catch(() => onChange(null));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const update = (c: CropBox) => {
    setCrop(c);
    onChange(whole ? null : c);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!crop) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: crop };
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    const img = imgRef.current;
    if (!d || !img || !size) return;
    const k = size.w / img.clientWidth; // px de pantalla → px de la imagen
    update(clampCrop({ ...d.start, sx: d.start.sx + (e.clientX - d.x) * k, sy: d.start.sy + (e.clientY - d.y) * k }, size.w, size.h));
  };
  const onKey = (e: KeyboardEvent) => {
    if (!crop || !size) return;
    const step = Math.max(8, size.w * 0.02);
    const move: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = move[e.key];
    if (!m) return;
    e.preventDefault();
    update(clampCrop({ ...crop, sx: crop.sx + m[0], sy: crop.sy + m[1] }, size.w, size.h));
  };

  const toggleWhole = (checked: boolean) => {
    setWhole(checked);
    onChange(checked ? null : crop);
  };

  const shorter = size ? Math.min(size.w, size.h) : 1;
  return (
    <div className="cropper">
      <div className="cropper-stage">
        <div className="cropper-frame">
        <img ref={imgRef} src={src} alt={alt} className="cropper-img" draggable={false} />
        {size && crop && !whole && (
          <div
            className="cropper-box"
            style={{ left: `${(crop.sx / size.w) * 100}%`, top: `${(crop.sy / size.h) * 100}%`, width: `${(crop.side / size.w) * 100}%`, height: `${(crop.side / size.h) * 100}%` }}
            role="slider"
            tabIndex={0}
            aria-label="Zona a analizar. Arrastra o usa las flechas para moverla"
            aria-valuetext={`${Math.round((crop.side / shorter) * 100)}% de la imagen`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
            onKeyDown={onKey}
          >
            <span className="cropper-grid" aria-hidden="true" />
          </div>
        )}
        </div>
      </div>

      <div className="cropper-tools">
        <label className="cropper-size">
          <span>Tamaño de la zona</span>
          <input
            type="range"
            min={20}
            max={100}
            value={crop && size ? Math.round((crop.side / shorter) * 100) : 80}
            disabled={whole || !size}
            aria-label="Tamaño de la zona a analizar"
            onChange={(e) => size && crop && update(resizeCrop(crop, (Number(e.target.value) / 100) * shorter, size.w, size.h))}
          />
        </label>
        <label className="check-inline">
          <input type="checkbox" checked={whole} onChange={(e) => toggleWhole(e.target.checked)} /> Analizar toda la imagen
        </label>
      </div>
      <p className="cropper-hint">{whole ? 'Se analizará la imagen completa.' : 'Arrastra el cuadro sobre el residuo y ajusta su tamaño para que ocupe casi todo el cuadro.'}</p>
    </div>
  );
}
