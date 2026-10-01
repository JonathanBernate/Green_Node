import React, { useMemo, useState } from 'react';
import { getLessons, Lesson } from '../../lib/domain';

export function EducationTab() {
  const [lessons, setLessons] = useState<Lesson[]>(() => getLessons());

  const progress = useMemo(() => {
    const done = lessons.filter((l) => l.completed).length;
    return { done, total: lessons.length, pct: (done / lessons.length) * 100 };
  }, [lessons]);

  const toggle = (id: string) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, completed: !l.completed } : l)),
    );
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <h2>📚 Aprender</h2>
        <p className="screen-subtitle">Micro-lecciones sobre gestión de residuos</p>
      </header>

      <div className="progress-card">
        <div className="progress-info">
          <span className="progress-title">Tu progreso</span>
          <span className="progress-count">
            {progress.done}/{progress.total} lecciones
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${progress.pct}%` }} />
        </div>
      </div>

      <div className="lesson-list">
        {lessons.map((l) => (
          <div
            key={l.id}
            className={`lesson-item ${l.completed ? 'completed' : ''}`}
            onClick={() => toggle(l.id)}
          >
            <div className="lesson-icon">{l.icon}</div>
            <div className="lesson-info">
              <p className="lesson-title">{l.title}</p>
              <p className="lesson-summary">{l.summary}</p>
              <div className="lesson-meta">
                <span className="lesson-cat">{l.category}</span>
                <span>· {l.durationMin} min</span>
              </div>
            </div>
            <span className={`lesson-check ${l.completed ? 'on' : ''}`}>
              {l.completed ? '✓' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
