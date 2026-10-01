import { describe, expect, it } from 'vitest';
import { ContainerStatus } from '../lib/domain';
import { deriveHealth, formatAgo } from './status';

const now = Date.parse('2026-10-01T12:00:00Z');
const fresh = '2026-10-01T11:59:30Z';
const base = { status: ContainerStatus.ACTIVE, lastUpdated: fresh };

describe('deriveHealth', () => {
  it('NORMAL por debajo del umbral de advertencia', () => {
    expect(deriveHealth({ ...base, fillLevel: 69 }, now)).toBe('NORMAL');
  });
  it('WARNING desde 70 % y CRITICAL desde 90 %', () => {
    expect(deriveHealth({ ...base, fillLevel: 70 }, now)).toBe('WARNING');
    expect(deriveHealth({ ...base, fillLevel: 89 }, now)).toBe('WARNING');
    expect(deriveHealth({ ...base, fillLevel: 90 }, now)).toBe('CRITICAL');
  });
  it('OFFLINE si el estado reportado es offline o mantenimiento', () => {
    expect(deriveHealth({ ...base, status: ContainerStatus.OFFLINE, fillLevel: 10 }, now)).toBe('OFFLINE');
    expect(deriveHealth({ ...base, status: ContainerStatus.MAINTENANCE, fillLevel: 95 }, now)).toBe('OFFLINE');
  });
  it('OFFLINE si lleva más de 15 minutos sin comunicar', () => {
    expect(deriveHealth({ status: ContainerStatus.ACTIVE, fillLevel: 95, lastUpdated: '2026-10-01T11:40:00Z' }, now)).toBe('OFFLINE');
  });
  it('OFFLINE con fecha inválida (no se inventa un estado)', () => {
    expect(deriveHealth({ status: ContainerStatus.ACTIVE, fillLevel: 10, lastUpdated: 'x' }, now)).toBe('OFFLINE');
  });
});

describe('formatAgo', () => {
  it('formatea segundos, minutos y horas', () => {
    expect(formatAgo('2026-10-01T11:59:30Z', now)).toBe('hace 30 s');
    expect(formatAgo('2026-10-01T11:50:00Z', now)).toBe('hace 10 min');
    expect(formatAgo('2026-10-01T09:00:00Z', now)).toBe('hace 3 h');
    expect(formatAgo(undefined, now)).toBe('—');
  });
});
