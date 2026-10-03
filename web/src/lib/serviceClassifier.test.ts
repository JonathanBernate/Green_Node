import { describe, expect, it } from 'vitest';
import { fromPrediction, mergePredictions } from './serviceClassifier';
import type { LivePrediction } from './liveClassifier';

const base = { inference_ms: 40, model: 'hf/waste' };

describe('fromPrediction', () => {
  it('convierte una predicción mapeada y calcula la caneca', () => {
    const p: LivePrediction = {
      ...base, label: 'green-glass', confidence: 0.82, group: 'reciclable', waste_type: 'glass',
      top3: [
        { label: 'green-glass', confidence: 0.82, group: 'reciclable', waste_type: 'glass' },
        { label: 'white-glass', confidence: 0.1, group: 'reciclable', waste_type: 'glass' },
        { label: 'plastic', confidence: 0.05, group: 'reciclable', waste_type: 'plastic' },
      ],
    };
    const r = fromPrediction(p);
    expect(r.wasteType).toBe('glass');
    expect(r.bin).toBe('blanca');
    expect(r.unmapped).toBe(false);
    expect(r.isLowConfidence).toBe(false);
    expect(r.probabilities).toHaveLength(6);
    expect(r.probabilities[3]).toBeCloseTo(0.92); // vidrio = verde + transparente
    expect(r.probabilities[1]).toBeCloseTo(0.05); // plástico
  });

  it('marca como no mapeado lo que no tiene equivalente (ropa) y lo manda a la caneca negra', () => {
    const r = fromPrediction({
      ...base, label: 'clothes', confidence: 0.9, group: 'no_reciclable', waste_type: null,
      top3: [{ label: 'clothes', confidence: 0.9, group: 'no_reciclable', waste_type: null }],
    });
    expect(r.unmapped).toBe(true);
    expect(r.bin).toBe('negra');
    expect(r.detectedLabel).toBe('clothes');
  });

  it('los orgánicos van a la caneca verde y la baja confianza se señala', () => {
    const r = fromPrediction({
      ...base, label: 'biological', confidence: 0.4, group: 'organico', waste_type: 'organic',
      top3: [{ label: 'biological', confidence: 0.4, group: 'organico', waste_type: 'organic' }],
    });
    expect(r.bin).toBe('verde');
    expect(r.isLowConfidence).toBe(true);
  });
});

describe('mergePredictions', () => {
  const view = (top: [string, number, string | null][]): LivePrediction => ({
    ...base, label: top[0][0], confidence: top[0][1], group: 'reciclable', waste_type: top[0][2], inference_ms: 30,
    top3: top.map(([label, confidence, waste_type]) => ({ label, confidence, group: 'reciclable' as const, waste_type })),
  });

  it('promedia las vistas y una etiqueta presente en una sola pesa menos', () => {
    const merged = mergePredictions([
      view([['plastic', 0.6, 'plastic'], ['metal', 0.3, 'metal']]),
      view([['metal', 0.55, 'metal'], ['plastic', 0.4, 'plastic']]),
    ]);
    expect(merged.label).toBe('plastic'); // plástico: (0.6+0.4)/2 = 0.5 frente a metal: (0.3+0.55)/2 = 0.425
    expect(merged.confidence).toBeCloseTo(0.5);
  });
});

describe('mergePredictions con una sola vista', () => {
  it('la devuelve tal cual', () => {
    const only: LivePrediction = { ...base, label: 'paper', confidence: 0.7, group: 'reciclable', waste_type: 'paper', top3: [{ label: 'paper', confidence: 0.7, group: 'reciclable', waste_type: 'paper' }] };
    expect(mergePredictions([only])).toBe(only);
  });
});
