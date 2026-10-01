import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Markdown } from '../common/Markdown';
import { Modal } from '../common/Modal';
import { Icon } from '../Icon';
import type { QuizResult } from '../../lib/domain';
import { lessonService } from '../../services/api';

function ResultCard({ passed, score, passScore, pointsEarned }: { passed: boolean; score: number; passScore: number; pointsEarned: number }) {
  return (
    <div className={`quiz-result ${passed ? 'ok' : 'bad'}`} role="status" aria-live="polite">
      <span className="quiz-result-icon" aria-hidden="true">{passed ? '🎉' : '📚'}</span>
      <div>
        <p className="quiz-result-title">{passed ? '¡Aprobaste!' : 'Aún no apruebas'}</p>
        <p className="quiz-result-text">
          Obtuviste <b>{score}%</b>.{' '}
          {passed
            ? pointsEarned > 0 ? <>Ganaste <b>+{pointsEarned} puntos</b>.</> : 'Ya tenías los puntos de esta lección.'
            : `Necesitas ${passScore}% para aprobar. Repasa la lección e inténtalo de nuevo.`}
        </p>
      </div>
    </div>
  );
}

interface Props {
  lessonId: string;
  onClose: () => void;
  /** Se llama al aprobar; el modal se cierra solo y quien lo abrió felicita al usuario. */
  onPassed?: (info: { title: string; result: QuizResult }) => void;
}

export function LessonModal({ lessonId, onClose, onPassed }: Props) {
  const qc = useQueryClient();
  const lesson = useQuery({ queryKey: ['lesson', lessonId], queryFn: () => lessonService.get(lessonId) });
  const [step, setStep] = useState<'read' | 'quiz'>('read');
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['lessons'] });
    void qc.invalidateQueries({ queryKey: ['lesson', lessonId] });
  };
  const submit = useMutation({
    mutationFn: () => lessonService.submit(lessonId, answers),
    onSuccess: (result) => {
      refresh();
      if (result.passed) {
        onPassed?.({ title: lesson.data?.data.title ?? 'la lección', result });
        onClose();
      }
    },
  });
  const reset = useMutation({
    mutationFn: () => lessonService.reset(lessonId),
    onSuccess: () => {
      submit.reset();
      setAnswers({});
      setStep('read');
      refresh();
    },
  });

  const l = lesson.data?.data;
  const result = submit.data;
  const questions = l?.questions ?? [];
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (result) bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [result]);
  const retry = () => { submit.reset(); setAnswers({}); };

  return (
    <Modal title={l?.title ?? 'Lección'} onClose={onClose}>
      {lesson.isLoading && <p className="inference-meta">Cargando lección…</p>}
      {lesson.isError && <div className="alert-box" role="alert">No fue posible cargar la lección.</div>}

      {l && step === 'read' && (
        <div className="lesson-body" ref={bodyRef}>
          <div className="lesson-meta lesson-meta-row">
            <span className="lesson-cat">{l.category}</span>
            <span>· {l.durationMin} min</span>
            <span>· {l.points} pts</span>
            {l.completed && <span className="badge-done">✓ Completada</span>}
          </div>
          <Markdown source={l.content} />
          <div className="lesson-actions">
            {l.hasQuiz ? (
              <button type="button" className="btn btn-primary btn-large" onClick={() => setStep('quiz')}>
                {l.completed ? 'Repetir cuestionario' : 'Hacer cuestionario'} <Icon name="chevron" size={16} />
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-large" disabled={l.completed || submit.isPending} onClick={() => submit.mutate()}>
                {l.completed ? 'Completada' : 'Marcar como completada'}
              </button>
            )}
            {l.completed && (
              <button type="button" className="btn btn-outline" onClick={() => reset.mutate()} disabled={reset.isPending}>
                Reiniciar avance
              </button>
            )}
          </div>
        </div>
      )}

      {l && step === 'quiz' && (
        <div className="lesson-body" ref={bodyRef}>
          {result && !result.passed && <ResultCard {...result} />}
          <ol className="quiz-list">
            {questions.map((q, qi) => {
              const r = result?.results.find((x) => x.questionId === q.id);
              return (
                <li key={q.id} className="quiz-q">
                  <p className="quiz-text">{qi + 1}. {q.question}</p>
                  <div className="quiz-options" role="radiogroup" aria-label={q.question}>
                    {q.options.map((o, oi) => {
                      const chosen = answers[q.id] === oi;
                      const state = r ? (oi === r.correctOption ? 'right' : chosen ? 'wrong' : '') : '';
                      return (
                        <label key={oi} className={`quiz-opt${chosen ? ' chosen' : ''} ${state}`}>
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={chosen}
                            disabled={!!result}
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                          />
                          <span>{o}</span>
                        </label>
                      );
                    })}
                  </div>
                  {r?.explanation && <p className={`quiz-expl ${r.correct ? 'ok' : 'bad'}`}>{r.correct ? '✓ ' : '✗ '}{r.explanation}</p>}
                </li>
              );
            })}
          </ol>

          {submit.isError && <div className="alert-box" role="alert">No fue posible enviar tus respuestas. Inténtalo de nuevo.</div>}

          <div className="lesson-actions">
            {!result && (
              <button type="button" className="btn btn-primary btn-large" disabled={!allAnswered || submit.isPending} onClick={() => submit.mutate()}>
                {submit.isPending ? 'Enviando…' : 'Enviar respuestas'}
              </button>
            )}
            {result && !result.passed && <button type="button" className="btn btn-primary btn-large" onClick={retry}>Reintentar</button>}
            <button type="button" className="btn btn-outline" onClick={() => { retry(); setStep('read'); }}>Volver a la lección</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
