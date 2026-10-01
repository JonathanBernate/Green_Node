import { describe, expect, it } from 'vitest';
import { buildEvent, classificationService } from './classificationService';

describe('buildEvent', () => {
  it('construye el evento waste_classification con el esquema esperado', () => {
    const e = buildEvent({ userId: 'u1', classification: 'plastic', confidence: 0.94321, model: 'm', inferenceTimeMs: 120 });
    expect(e).toMatchObject({
      event_type: 'waste_classification',
      user_id: 'u1',
      classification: 'plastic',
      confidence: 0.9432,
      model: 'm',
      inference_time_ms: 120,
      source: 'SIMULATION',
    });
    expect(Date.parse(e.timestamp)).not.toBeNaN();
    expect(e.location).toBeUndefined();
  });
  it('incluye la ubicación solo si se entrega', () => {
    expect(buildEvent({ userId: 'u', classification: 'glass', confidence: 1, location: { lat: 4.6, lng: -74.07 } }).location).toEqual({ lat: 4.6, lng: -74.07 });
  });
});

describe('classificationService (simulación)', () => {
  it('guarda el evento en cola local sin fingir que se envió', async () => {
    const stored = await classificationService.sendEvent(buildEvent({ userId: 'u', classification: 'paper', confidence: 0.8 }));
    expect(stored.delivery).toBe('stored-local');
    expect(classificationService.queue()).toHaveLength(1);
  });
  it('flush no envía nada en modo simulación', async () => {
    expect(await classificationService.flush()).toBe(0);
  });
});
