import { describe, expect, it } from 'vitest';
import { clampCrop, defaultCrop, resizeCrop } from './cropImage';

describe('recorte de galería', () => {
  it('la zona inicial es un cuadrado centrado del 80% del lado menor', () => {
    const c = defaultCrop(2000, 1000);
    expect(c.side).toBeCloseTo(800);
    expect(c.sx).toBeCloseTo(600);
    expect(c.sy).toBeCloseTo(100);
  });
  it('no deja que el cuadrado salga de la imagen', () => {
    expect(clampCrop({ sx: -50, sy: 900, side: 300 }, 1000, 1000)).toEqual({ sx: 0, sy: 700, side: 300 });
    expect(clampCrop({ sx: 0, sy: 0, side: 5000 }, 800, 600).side).toBe(600);
  });
  it('al cambiar el tamaño mantiene el centro', () => {
    const r = resizeCrop({ sx: 400, sy: 400, side: 200 }, 400, 1000, 1000);
    expect(r.sx + r.side / 2).toBeCloseTo(500);
    expect(r.sy + r.side / 2).toBeCloseTo(500);
  });
});
