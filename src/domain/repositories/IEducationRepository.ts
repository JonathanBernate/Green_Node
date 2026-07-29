import type { Lesson, LessonCategory } from '../entities/Lesson';

export interface IEducationRepository {
  getLessons(category?: LessonCategory): Promise<Lesson[]>;
  getById(id: string): Promise<Lesson | null>;
  markCompleted(lessonId: string, userId: string): Promise<void>;
  getRecommended(userId: string): Promise<Lesson[]>;
  getProgress(userId: string): Promise<{ completed: number; total: number }>;
}
