import { config } from '../../config/env';
import type { Lesson, LessonDetail, QuizResult } from '../../lib/domain';
import { MOCK_LESSONS } from '../../mocks/lessons';
import type { Sourced } from '../../types';
import { request } from './apiClient';

const PASS_SCORE = 70;
const KEY = 'greennode_lesson_progress';

type Progress = Record<string, { score: number; completed: boolean }>;

const wrap = <T>(data: T, source: Sourced<T>['source']): Sourced<T> => ({ data, source, receivedAt: new Date().toISOString() });

function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Progress;
  } catch {
    return {};
  }
}
function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* sin almacenamiento: el avance no se conserva */
  }
}

function mockSummary(l: (typeof MOCK_LESSONS)[number], p: Progress): Lesson {
  return {
    id: l.id, title: l.title, icon: l.icon, durationMin: l.durationMin, category: l.category, categoryId: l.categoryId,
    summary: l.summary, points: l.points, hasQuiz: l.questions.length > 0,
    completed: p[l.id]?.completed ?? false, score: p[l.id]?.score ?? null,
  };
}

/** Lecciones de aprendizaje. Con VITE_USE_MOCK_DATA=true usa contenido local y guarda el avance en el navegador. */
export const lessonService = {
  async list(): Promise<Sourced<Lesson[]>> {
    if (config.useMockData) {
      const p = loadProgress();
      return wrap(MOCK_LESSONS.map((l) => mockSummary(l, p)), 'SIMULATION');
    }
    return wrap(await request<Lesson[]>('/api/lessons'), 'REAL');
  },

  async get(id: string): Promise<Sourced<LessonDetail>> {
    if (config.useMockData) {
      const l = MOCK_LESSONS.find((x) => x.id === id);
      if (!l) throw new Error('Lección no encontrada');
      return wrap(
        { ...mockSummary(l, loadProgress()), content: l.content, questions: l.questions.map(({ id: qid, question, options }) => ({ id: qid, question, options })) },
        'SIMULATION',
      );
    }
    return wrap(await request<LessonDetail>(`/api/lessons/${encodeURIComponent(id)}`), 'REAL');
  },

  /** `answers`: id de pregunta → índice de la opción elegida. */
  async submit(id: string, answers: Record<string, number>): Promise<QuizResult> {
    if (!config.useMockData) {
      return request<QuizResult>(`/api/lessons/${encodeURIComponent(id)}/submit`, { method: 'POST', body: { answers } });
    }
    const l = MOCK_LESSONS.find((x) => x.id === id);
    if (!l) throw new Error('Lección no encontrada');
    const results = l.questions.map((q) => ({
      questionId: q.id, correct: answers[q.id] === q.correctOption, correctOption: q.correctOption, explanation: q.explanation,
    }));
    const score = results.length ? Math.round((results.filter((r) => r.correct).length / results.length) * 100) : 100;
    const passed = score >= PASS_SCORE;
    const p = loadProgress();
    const was = p[id]?.completed ?? false;
    p[id] = { score: Math.max(p[id]?.score ?? 0, score), completed: was || passed };
    saveProgress(p);
    return { score, passed, passScore: PASS_SCORE, pointsEarned: passed && !was ? l.points : 0, results };
  },

  async reset(id: string): Promise<void> {
    if (config.useMockData) {
      const p = loadProgress();
      delete p[id];
      saveProgress(p);
      return;
    }
    await request(`/api/lessons/${encodeURIComponent(id)}/progress`, { method: 'DELETE' });
  },
};
