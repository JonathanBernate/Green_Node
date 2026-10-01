export interface Lesson {
  id: string;
  title: string;
  description: string;
  durationSeconds: number; // 60-90s
  category: LessonCategory;
  thumbnailUrl: string;
  contentUrl: string;
  order: number;
  completed: boolean;
  quiz?: LessonQuiz;
}

export enum LessonCategory {
  CLASSIFICATION = 'classification',
  RECYCLING = 'recycling',
  ENVIRONMENT = 'environment',
  TIPS = 'tips',
}

export interface LessonQuiz {
  question: string;
  options: string[];
  correctIndex: number;
}
