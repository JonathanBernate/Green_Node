import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_LESSONS } from '../../mocks/lessons';
import { lessonService } from './lessonService';

describe('lessonService (simulación)', () => {
  beforeEach(() => localStorage.clear());

  it('lista las lecciones sin completar al inicio', async () => {
    const r = await lessonService.list();
    expect(r.source).toBe('SIMULATION');
    expect(r.data).toHaveLength(MOCK_LESSONS.length);
    expect(r.data.every((l) => !l.completed)).toBe(true);
  });

  it('no expone las respuestas correctas en el detalle', async () => {
    const d = (await lessonService.get(MOCK_LESSONS[0].id)).data;
    expect(d.content.length).toBeGreaterThan(0);
    expect(JSON.stringify(d.questions)).not.toContain('correctOption');
  });

  it('aprueba con respuestas correctas y otorga puntos una sola vez', async () => {
    const l = MOCK_LESSONS[0];
    const answers = Object.fromEntries(l.questions.map((q) => [q.id, q.correctOption]));
    const first = await lessonService.submit(l.id, answers);
    expect(first).toMatchObject({ score: 100, passed: true, pointsEarned: l.points });
    expect((await lessonService.submit(l.id, answers)).pointsEarned).toBe(0);
    expect((await lessonService.list()).data[0].completed).toBe(true);
  });

  it('reprueba con respuestas incorrectas y permite reiniciar', async () => {
    const l = MOCK_LESSONS[0];
    const wrong = Object.fromEntries(l.questions.map((q) => [q.id, (q.correctOption + 1) % q.options.length]));
    const r = await lessonService.submit(l.id, wrong);
    expect(r.passed).toBe(false);
    expect((await lessonService.list()).data[0].completed).toBe(false);
    await lessonService.reset(l.id);
    expect((await lessonService.list()).data[0].score).toBeNull();
  });
});
