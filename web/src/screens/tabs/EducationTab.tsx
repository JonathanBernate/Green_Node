import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { DataSourceTag } from '../../components/common/DataSourceTag';
import { LessonModal } from '../../components/learn/LessonModal';
import type { QuizResult } from '../../lib/domain';
import { lessonService } from '../../services/api';

export function EducationTab() {
  const q = useQuery({ queryKey: ['lessons'], queryFn: () => lessonService.list() });
  const [category, setCategory] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [congrats, setCongrats] = useState<{ title: string; result: QuizResult } | null>(null);

  useEffect(() => {
    if (!congrats) return;
    const t = setTimeout(() => setCongrats(null), 6000);
    return () => clearTimeout(t);
  }, [congrats]);

  const lessons = q.data?.data ?? [];
  const categories = useMemo(() => {
    const m = new Map<string, string>();
    lessons.forEach((l) => m.set(l.categoryId, l.category));
    return [...m.entries()];
  }, [lessons]);
  const visible = lessons.filter((l) => category === 'all' || l.categoryId === category);

  const done = lessons.filter((l) => l.completed).length;
  const earned = lessons.filter((l) => l.completed).reduce((s, l) => s + l.points, 0);
  const pct = lessons.length ? (done / lessons.length) * 100 : 0;

  return (
    <div className="screen wide">
      <header className="screen-header">
        <h2>Aprender</h2>
        <p className="screen-subtitle">
          Lecciones sobre gestión de residuos{q.data && <> · <DataSourceTag source={q.data.source} /></>}
        </p>
      </header>

      <div className="progress-card">
        <div className="progress-info">
          <span className="progress-title">Tu progreso</span>
          <span className="progress-count">{done}/{lessons.length} lecciones · {earned} pts</span>
        </div>
        <div className="progress-track" role="progressbar" aria-label="Progreso de lecciones" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {categories.length > 1 && (
        <div className="chip-row" role="group" aria-label="Filtrar por categoría">
          <button type="button" className={`chip${category === 'all' ? ' active' : ''}`} onClick={() => setCategory('all')}>Todas <b>{lessons.length}</b></button>
          {categories.map(([id, name]) => (
            <button key={id} type="button" className={`chip${category === id ? ' active' : ''}`} onClick={() => setCategory(id)}>
              {name} <b>{lessons.filter((l) => l.categoryId === id).length}</b>
            </button>
          ))}
        </div>
      )}

      {q.isLoading && <p className="inference-meta">Cargando lecciones…</p>}
      {q.isError && <div className="alert-box" role="alert">No fue posible cargar las lecciones.</div>}
      {q.isSuccess && lessons.length === 0 && <p className="inference-meta">Aún no hay lecciones publicadas.</p>}

      <div className="lesson-list">
        {visible.map((l) => (
          <button key={l.id} type="button" className={`lesson-item ${l.completed ? 'completed' : ''}`} onClick={() => setOpenId(l.id)}>
            <div className="lesson-icon">{l.icon}</div>
            <div className="lesson-info">
              <p className="lesson-title">{l.title}</p>
              <p className="lesson-summary">{l.summary}</p>
              <div className="lesson-meta">
                <span className="lesson-cat">{l.category}</span>
                <span>· {l.durationMin} min</span>
                <span>· {l.points} pts</span>
                {l.score != null && !l.completed && <span>· mejor: {l.score}%</span>}
              </div>
            </div>
            <span className={`lesson-check ${l.completed ? 'on' : ''}`} aria-label={l.completed ? 'Completada' : 'Pendiente'}>
              {l.completed ? '✓' : ''}
            </span>
          </button>
        ))}
      </div>

      {openId && <LessonModal lessonId={openId} onClose={() => setOpenId(null)} onPassed={setCongrats} />}

      {congrats && (
        <div className="congrats" role="status" aria-live="polite">
          <span className="congrats-icon" aria-hidden="true">🎉</span>
          <div className="congrats-text">
            <p className="congrats-title">¡Felicitaciones, aprobaste!</p>
            <p>
              Completaste «{congrats.title}» con <b>{congrats.result.score}%</b>.{' '}
              {congrats.result.pointsEarned > 0 ? <>Ganaste <b>+{congrats.result.pointsEarned} puntos</b>.</> : 'Ya tenías los puntos de esta lección.'}
            </p>
          </div>
          <button type="button" className="congrats-close" onClick={() => setCongrats(null)} aria-label="Cerrar mensaje">✕</button>
        </div>
      )}
    </div>
  );
}
