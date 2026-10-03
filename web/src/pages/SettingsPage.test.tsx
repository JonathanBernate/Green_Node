import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { passwordStrength } from '../components/settings/SecuritySection';
import { renderWithProviders } from '../test/utils';
import { validateAvatarFile } from '../utils/image';
import { SettingsPage } from './SettingsPage';

const okJson = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const baseUser = { id: '1', name: 'Test User', email: 't@x.co', points: 120, level: 3, role: 'user', avatar: null };

afterEach(() => vi.unstubAllGlobals());

/** Llamadas de escritura (el historial hace GET de sincronización al montar). */
const writes = (m: ReturnType<typeof vi.fn>) => m.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method && (init as RequestInit).method !== 'GET');

describe('utilidades', () => {
  it('valida el archivo de la foto de perfil', () => {
    expect(validateAvatarFile({ type: 'image/png', size: 1000 })).toBeNull();
    expect(validateAvatarFile({ type: 'image/svg+xml', size: 1000 })).toMatch(/JPG, PNG o WebP/);
    expect(validateAvatarFile({ type: 'image/jpeg', size: 9 * 1024 * 1024 })).toMatch(/8 MB/);
  });
  it('mide la fortaleza de la contraseña', () => {
    expect(passwordStrength('abc')).toBe(0);
    expect(passwordStrength('abcdefg1')).toBe(1);
    expect(passwordStrength('Abcdefgh1234!')).toBe(4);
  });
});

describe('SettingsPage', () => {
  it('navega entre secciones con pestañas', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);
    expect(screen.getByRole('tab', { name: /Perfil/, selected: true })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Seguridad/ }));
    expect(screen.getByRole('heading', { name: 'Cambiar contraseña' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Datos/ }));
    expect(screen.getByRole('heading', { name: 'Datos de este navegador' })).toBeInTheDocument();
  });

  it('valida el cambio de contraseña antes de enviar', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />, '/settings?tab=seguridad');
    await user.click(screen.getByRole('button', { name: 'Actualizar contraseña' }));
    expect(screen.getByText('Escribe tu contraseña actual.')).toBeInTheDocument();
    expect(screen.getByText('Mínimo 8 caracteres.')).toBeInTheDocument();
    expect(writes(fetchMock)).toHaveLength(0);
  });

  it('muestra requisitos en vivo, el ojo de cada campo y las sesiones activas', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => okJson(
      String(url).includes('/api/user/sessions')
        ? [
            { id: 1, device: 'Safari · iOS', created_at: null, last_used_at: new Date().toISOString(), current: true },
            { id: 2, device: 'Chrome · Windows', created_at: null, last_used_at: new Date().toISOString(), current: false },
          ]
        : [],
    )));
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />, '/settings?tab=seguridad');
    expect(await screen.findByText('Este dispositivo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar las otras (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión de Chrome · Windows' })).toBeInTheDocument();

    const field = screen.getByLabelText('Nueva contraseña');
    expect(field).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Mostrar nueva contraseña' }));
    expect(field).toHaveAttribute('type', 'text');

    await user.type(field, 'Abcdefg1');
    expect(screen.getByText(/Al menos 8 caracteres/).closest('li')).toHaveClass('ok');
    expect(screen.getByText(/Letras y números/).closest('li')).toHaveClass('ok');
    expect(screen.getByText(/Mayúsculas, minúsculas y símbolo/).closest('li')).not.toHaveClass('ok');
  });

  it('guarda el nombre nuevo en el backend y actualiza la sesión', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okJson({ ...baseUser, name: 'Ana Pérez' })));
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);
    const input = screen.getByLabelText('Nombre');
    await user.clear(input);
    await user.type(input, 'Ana Pérez');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Nombre actualizado.')).toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(localStorage.getItem('auth_user')!).name).toBe('Ana Pérez'));
  });

  it('rechaza un archivo que no es imagen antes de subirlo', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup({ applyAccept: false });
    renderWithProviders(<SettingsPage />);
    await user.upload(screen.getByLabelText('Archivo de imagen'), new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }));
    expect(await screen.findByText('Usa una imagen JPG, PNG o WebP.')).toBeInTheDocument();
    expect(writes(fetchMock)).toHaveLength(0);
  });
});
