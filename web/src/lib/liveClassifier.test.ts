import { describe, expect, it } from 'vitest';
import { binForLive, LivePrediction, LiveSmoother } from './liveClassifier';

const pred = (label: string, confidence: number, group: LivePrediction['group'], waste_type: string | null, rest: LivePrediction['top3'] = []): LivePrediction => ({
  label, confidence, group, waste_type, inference_ms: 10,
  top3: [{ label, confidence, group, waste_type }, ...rest],
});

describe('binForLive', () => {
  it('asigna la caneca según el tipo de residuo', () => {
    expect(binForLive({ group: 'reciclable', waste_type: 'plastic' })).toBe('blanca');
    expect(binForLive({ group: 'reciclable', waste_type: 'glass' })).toBe('blanca');
    expect(binForLive({ group: 'organico', waste_type: 'organic' })).toBe('verde');
    expect(binForLive({ group: 'peligroso', waste_type: 'special' })).toBe('negra');
  });
  it('sin tipo equivalente (ropa, calzado, basura) usa el grupo', () => {
    expect(binForLive({ group: 'no_reciclable', waste_type: null })).toBe('negra');
    expect(binForLive({ group: 'organico', waste_type: null })).toBe('verde');
    expect(binForLive({ group: 'reciclable', waste_type: null })).toBe('blanca');
  });
});

describe('LiveSmoother', () => {
  it('espera varios fotogramas antes de decidir', () => {
    const s = new LiveSmoother();
    expect(s.push(pred('plastic', 0.9, 'reciclable', 'plastic'))).toBeNull();
    expect(s.push(pred('plastic', 0.9, 'reciclable', 'plastic'))).toBeNull();
    expect(s.push(pred('plastic', 0.9, 'reciclable', 'plastic'))?.label).toBe('plastic');
  });
  it('no salta por un fotograma aislado distinto', () => {
    const s = new LiveSmoother();
    for (let i = 0; i < 4; i++) s.push(pred('plastic', 0.9, 'reciclable', 'plastic'));
    const out = s.push(pred('trash', 0.8, 'no_reciclable', null));
    expect(out?.label).toBe('plastic');
  });
  it('cambia cuando el objeto cambia de verdad', () => {
    const s = new LiveSmoother();
    for (let i = 0; i < 5; i++) s.push(pred('plastic', 0.9, 'reciclable', 'plastic'));
    let out = null as ReturnType<LiveSmoother['push']>;
    for (let i = 0; i < 5; i++) out = s.push(pred('biological', 0.9, 'organico', 'organic'));
    expect(out?.label).toBe('biological');
    expect(binForLive(out!.prediction)).toBe('verde');
  });
  it('no decide si las predicciones son inciertas', () => {
    const s = new LiveSmoother();
    let out = null as ReturnType<LiveSmoother['push']>;
    for (let i = 0; i < 5; i++) out = s.push(pred('paper', 0.2, 'reciclable', 'paper'));
    expect(out).toBeNull();
  });
});
