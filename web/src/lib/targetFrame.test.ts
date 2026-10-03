import { describe, expect, it } from 'vitest';
import { TARGET_RATIO, targetCrop } from './targetFrame';

describe('targetCrop', () => {
  it('video y contenedor con la misma proporción: el recorte es TARGET_RATIO del lado menor', () => {
    const c = targetCrop(1280, 720, 640, 360);
    expect(c.side).toBeCloseTo(720 * TARGET_RATIO);
    expect(c.sx).toBeCloseTo((1280 - c.side) / 2);
    expect(c.sy).toBeCloseTo((720 - c.side) / 2);
  });

  it('con object-fit: cover se tiene en cuenta la parte del video que queda oculta', () => {
    // Video 16:9 mostrado en un contenedor casi cuadrado (360x460): escala = 460/720
    const c = targetCrop(1280, 720, 360, 460);
    const scale = 460 / 720;
    expect(c.side).toBeCloseTo((360 * TARGET_RATIO) / scale);
    expect(c.sx + c.side / 2).toBeCloseTo(640); // centrado
    expect(c.sy + c.side / 2).toBeCloseTo(360);
  });

  it('nunca excede el video', () => {
    expect(targetCrop(320, 240, 100, 1000, 5).side).toBeLessThanOrEqual(240);
  });

  it('sin medidas de pantalla usa una fracción del lado menor', () => {
    expect(targetCrop(640, 480, 0, 0).side).toBeCloseTo(480 * TARGET_RATIO);
  });
});
