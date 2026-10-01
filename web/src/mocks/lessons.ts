/** Contenido educativo de ejemplo (estático). */
import type { Lesson } from '../lib/domain';

export function getLessons(): Lesson[] {
  return [
    {
      id: 'l-1',
      title: '¿Por qué separar los residuos?',
      icon: '🌍',
      durationMin: 3,
      category: 'Fundamentos',
      summary: 'Entiende el impacto ambiental de la separación en origen.',
      completed: true,
    },
    {
      id: 'l-2',
      title: 'Los 6 tipos de residuos',
      icon: '🗂️',
      durationMin: 5,
      category: 'Clasificación',
      summary: 'Aprende a distinguir orgánico, plástico, papel, vidrio, metal y especial.',
      completed: true,
    },
    {
      id: 'l-3',
      title: 'Reciclaje de plásticos',
      icon: '♻️',
      durationMin: 4,
      category: 'Clasificación',
      summary: 'Códigos de reciclaje y qué plásticos sí se reciclan.',
      completed: false,
    },
    {
      id: 'l-4',
      title: 'Compostaje en casa',
      icon: '🍃',
      durationMin: 6,
      category: 'Práctica',
      summary: 'Convierte tus residuos orgánicos en abono.',
      completed: false,
    },
    {
      id: 'l-5',
      title: 'Residuos especiales y peligrosos',
      icon: '⚠️',
      durationMin: 4,
      category: 'Seguridad',
      summary: 'Cómo manejar pilas, electrónicos y medicamentos.',
      completed: false,
    },
  ];
}
