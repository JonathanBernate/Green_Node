/**
 * Contenido educativo de SIMULACIÓN. Es una copia del seeder del backend
 * (admin/database/seeders/LessonSeeder.php) para poder usar la sección sin servidor.
 */
import data from '../data/lessons.json';

export interface MockQuestion {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface MockLesson {
  id: string;
  title: string;
  icon: string;
  category: string;
  categoryId: string;
  summary: string;
  durationMin: number;
  points: number;
  content: string;
  questions: MockQuestion[];
}

export const MOCK_LESSONS = data as MockLesson[];
