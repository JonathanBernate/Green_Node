import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { lessonService } from '../../services/api';

const MAX_ITEMS = 4;

/** Resumen del avance de aprendizaje para el inicio: lecciones aprendidas y pendientes. */
export function LearningCard() {
  const q = useQuery({ queryKey: ['lessons'], queryFn: () => lessonService.list() });
  const lessons = q.data?.data ?? [];
  const done = lessons.filter((l) => l.completed);
  const todo = lessons.filter((l) => !l.completed);
  const pct = lessons.length ? (done.length / lessons.length) * 100 : 0;

  return (
    <section className="panel learn-card" aria-label="Progreso de aprendizaje">
      <div className="learn-card-head">
        <h3 className="section-title">Tu aprendizaje</h3>
        <span className="count-pill">{done.length}/{lessons.length}</span>
      </div>

      {q.isLoading && <p className="inference-meta">Cargando lecciones…</p>}
      {q.isError && <p className="inference-meta">No fue posible cargar las lecciones.</p>}

      {q.isSuccess && (
        <>
          <div className="learn-track" role="progressbar" aria-label="Lecciones aprendidas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
            <div className="learn-fill" style={{ width: `${pct}%` }} />
          </div>

          <div className="learn-cols">
            <div>
              <h4 className="learn-sub">Aprendidas <b>{done.length}</b></h4>
              {done.length === 0 ? (
                <p className="inference-meta">Aún no completas ninguna lección.</p>
              ) : (
                <ul className="learn-list">
                  {done.slice(0, MAX_ITEMS).map((l) => (
                    <li key={l.id} className="done"><span className="learn-mark" aria-hidden="true">✓</span><span>{l.icon} {l.title}</span></li>
                  ))}
                </ul>
              )}
              {done.length > MAX_ITEMS && <p className="inference-meta">+{done.length - MAX_ITEMS} más</p>}
            </div>

            <div>
              <h4 className="learn-sub">Por aprender <b>{todo.length}</b></h4>
              {todo.length === 0 ? (
                <p className="inference-meta">🎉 ¡Completaste todas las lecciones!</p>
              ) : (
                <ul className="learn-list">
                  {todo.slice(0, MAX_ITEMS).map((l) => (
                    <li key={l.id}><span className="learn-mark" aria-hidden="true" /><span>{l.icon} {l.title} <small>· {l.durationMin} min</small></span></li>
                  ))}
                </ul>
              )}
              {todo.length > MAX_ITEMS && <p className="inference-meta">+{todo.length - MAX_ITEMS} más</p>}
            </div>
          </div>

          <Link to="/learn" className="panel-link">{todo.length > 0 ? 'Seguir aprendiendo' : 'Repasar lecciones'} →</Link>
        </>
      )}
    </section>
  );
}
