import { describe, expect, it } from 'vitest';
import { reportService, sanitizeText, validateReport } from './reportService';

describe('validateReport', () => {
  it('exige tipo, contenedor y descripción mínima', () => {
    expect(Object.keys(validateReport({ type: '', container_id: '', description: '' })).sort()).toEqual(['container_id', 'description', 'type']);
  });
  it('rechaza descripciones demasiado cortas o largas', () => {
    expect(validateReport({ type: 'full', container_id: 'c-001', description: 'corto' }).description).toBeDefined();
    expect(validateReport({ type: 'full', container_id: 'c-001', description: 'x'.repeat(501) }).description).toBeDefined();
  });
  it('acepta un reporte válido', () => {
    expect(validateReport({ type: 'full', container_id: 'c-001', description: 'El contenedor está desbordado' })).toEqual({});
  });
});

describe('sanitizeText', () => {
  it('elimina caracteres de control y espacios repetidos', () => {
    expect(sanitizeText('  hola\u0000\u0007   mundo\n\n ')).toBe('hola mundo');
  });
});

describe('reportService (simulación)', () => {
  it('guarda el reporte localmente marcado como SIMULATION', async () => {
    const r = await reportService.create({ type: 'damaged', container_id: 'c-002', description: 'Tapa rota y atascada', location: ' esquina ' });
    expect(r.source).toBe('SIMULATION');
    expect(r.location).toBe('esquina');
    expect(await reportService.list()).toHaveLength(1);
  });
  it('rechaza datos inválidos', async () => {
    await expect(reportService.create({ type: '', container_id: '', description: '' })).rejects.toThrow('validation');
  });
});
