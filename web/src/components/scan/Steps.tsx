/** Indicador de pasos del flujo foto / galería. */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="steps" aria-label="Progreso">
      {steps.map((s, i) => (
        <li key={s} className={i < current ? 'done' : i === current ? 'now' : ''} aria-current={i === current ? 'step' : undefined}>
          <span className="steps-dot">{i < current ? '✓' : i + 1}</span>
          <span className="steps-label">{s}</span>
        </li>
      ))}
    </ol>
  );
}
