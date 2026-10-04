import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginScreen } from './LoginScreen';

describe('LoginScreen: contraseña olvidada', () => {
  it('muestra el aviso de contactar al administrador al pulsar "¿Olvidaste tu contraseña?"', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);
    expect(screen.queryByText('Comunícate con el administrador')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));
    expect(screen.getByRole('status')).toHaveTextContent('Comunícate con el administrador');
  });
});
