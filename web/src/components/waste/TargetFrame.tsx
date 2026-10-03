import { CSSProperties, useEffect, useRef, useState } from 'react';
import { TARGET_RATIO } from '../../lib/targetFrame';

interface Props {
  /** Color del marco (p. ej. el de la caneca detectada). */
  color?: string;
  hint?: string;
}

/**
 * Marco para apuntar el residuo. Oscurece lo que queda fuera: solo se analiza lo que está dentro
 * (ver targetCrop). Debe ir dentro del contenedor de la cámara, que define su tamaño.
 */
export function TargetFrame({ color, hint = 'Coloca el residuo dentro del marco' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(0);

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const update = () => setSide(Math.round(Math.min(parent.clientWidth, parent.clientHeight) * TARGET_RATIO));
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  const style = { width: side || '62%', height: side || undefined, aspectRatio: '1', ['--c' as string]: color } as CSSProperties;
  return (
    <div ref={ref} className="target-wrap" aria-hidden="true">
      <div className="target-dim" style={style} />
      <div className="target-box" style={style} />
      {hint && <span className="target-hint" style={{ transform: `translateY(${Math.round(side / 2) + 22}px)` }}>{hint}</span>}
    </div>
  );
}
