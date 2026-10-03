import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WASTE_TYPE_BIN, WasteType } from '../../lib/domain';
import { BinResult } from './BinResult';

describe('BinResult', () => {
  it('indica la caneca donde se deposita', () => {
    render(<BinResult bin="verde" />);
    expect(screen.getByRole('status', { name: 'Va en la Caneca verde' })).toBeInTheDocument();
    expect(screen.getByText('Orgánicos aprovechables')).toBeInTheDocument();
  });
  it('si el modelo no está seguro lo presenta como sugerencia', () => {
    render(<BinResult bin="blanca" uncertain />);
    expect(screen.getByText('Probablemente va en la')).toBeInTheDocument();
  });
});

describe('WASTE_TYPE_BIN', () => {
  it('solo existen tres canecas y todo residuo tiene una', () => {
    const bins = new Set(Object.values(WasteType).map((w) => WASTE_TYPE_BIN[w]));
    expect([...bins].sort()).toEqual(['blanca', 'negra', 'verde']);
  });
});
