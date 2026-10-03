import { KeyboardEvent } from 'react';
import { Icon } from '../Icon';

export type ScanMode = 'live' | 'camera' | 'upload';

export const MODES: { id: ScanMode; slug: string; label: string; hint: string; icon: string }[] = [
  { id: 'live', slug: 'vivo', label: 'En vivo', hint: 'Apunta y clasifica al instante', icon: 'bolt' },
  { id: 'camera', slug: 'foto', label: 'Foto', hint: 'Toma una foto del residuo', icon: 'camera' },
  { id: 'upload', slug: 'galeria', label: 'Galería', hint: 'Elige una imagen guardada', icon: 'image' },
];

export const modeFromSlug = (slug: string | null): ScanMode => MODES.find((m) => m.slug === slug)?.id ?? 'live';
export const slugFromMode = (mode: ScanMode) => MODES.find((m) => m.id === mode)!.slug;

/** Pestañas del escáner con indicador deslizante y navegación por flechas. */
export function ModeTabs({ mode, onChange }: { mode: ScanMode; onChange: (m: ScanMode) => void }) {
  const index = MODES.findIndex((m) => m.id === mode);
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = MODES[(i + (e.key === 'ArrowRight' ? 1 : -1) + MODES.length) % MODES.length].id;
    onChange(next);
    document.getElementById(`scan-tab-${next}`)?.focus();
  };
  return (
    <div className="mode-tabs" role="tablist" aria-label="Modo de escaneo" style={{ ['--i' as string]: index }}>
      {MODES.map((m, i) => (
        <button
          key={m.id}
          id={`scan-tab-${m.id}`}
          role="tab"
          type="button"
          aria-selected={mode === m.id}
          aria-controls="scan-panel"
          tabIndex={mode === m.id ? 0 : -1}
          className={`mode-tab${mode === m.id ? ' active' : ''}`}
          onClick={() => onChange(m.id)}
          onKeyDown={(e) => onKey(e, i)}
        >
          <Icon name={m.icon} size={18} />
          <span className="mode-tab-text"><b>{m.label}</b><small>{m.hint}</small></span>
        </button>
      ))}
    </div>
  );
}
