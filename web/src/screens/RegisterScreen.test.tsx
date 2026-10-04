import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegisterScreen, validateRegister } from './RegisterScreen';

afterEach(() => vi.unstubAllGlobals());

/** Simula el backend: /register/options y /register. */
function backend(register: { ok: boolean; status: number; body: unknown }, codeRequired = false) {
  const fn = vi.fn(async (url: string) => String(url).includes('/register/options')
    ? { ok: true, status: 200, json: async () => ({ container_code_required: codeRequired }) }
    : { ok: register.ok, status: register.status, json: async () => register.body });
  vi.stubGlobal('fetch', fn);
  return fn;
}
const registerCall = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.find(([u]) => String(u).endsWith('/api/register')) as unknown as [string, RequestInit] | undefined;

const fill = async (user: ReturnType<typeof userEvent.setup>, v: { name?: string; email?: string; password?: string; confirm?: string }) => {
  if (v.name) await user.type(screen.getByLabelText(/^(Nombre|Tu nombre \(responsable\))$/), v.name);
  if (v.email) await user.type(screen.getByLabelText('Correo electrónico'), v.email);
  if (v.password) await user.type(screen.getByLabelText('Contraseña'), v.password);
  if (v.confirm) await user.type(screen.getByLabelText('Confirmar contraseña'), v.confirm);
};

describe('validateRegister', () => {
  it('exige todos los campos', () => {
    expect(Object.keys(validateRegister({ name: '', email: '', password: '', confirm: '' })).sort()).toEqual(['email', 'name', 'password']);
  });
  it('revisa formato de correo, contraseña y confirmación', () => {
    const e = validateRegister({ name: 'Ana', email: 'ana@', password: 'solo letras', confirm: 'otra' });
    expect(e.email).toMatch(/válido/);
    expect(e.password).toMatch(/letras y números/);
    expect(e.confirm).toMatch(/no coinciden/);
  });
  it('acepta datos correctos', () => {
    expect(validateRegister({ name: 'Ana Pérez', email: 'ana@test.co', password: 'clave1234', confirm: 'clave1234' })).toEqual({});
  });
});

describe('RegisterScreen', () => {
  it('no envía nada si el formulario es inválido', async () => {
    const fetchMock = backend({ ok: true, status: 201, body: {} });
    const user = userEvent.setup();
    render(<RegisterScreen onRegistered={vi.fn()} onLogin={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(screen.getByText(/Escribe tu nombre/)).toBeInTheDocument();
    expect(screen.getByText('Escribe tu correo electrónico.')).toBeInTheDocument();
    expect(registerCall(fetchMock)).toBeUndefined();
  });

  it('crea la cuenta y entrega usuario y token', async () => {
    const payload = { user: { id: '9', name: 'Ana Pérez', email: 'ana@test.co', role: 'user', points: 0, level: 1 }, token: 'tkn' };
    const fetchMock = backend({ ok: true, status: 201, body: payload });
    const onRegistered = vi.fn();
    const user = userEvent.setup();
    render(<RegisterScreen onRegistered={onRegistered} onLogin={vi.fn()} />);
    await fill(user, { name: 'Ana Pérez', email: 'Ana@Test.co', password: 'clave1234', confirm: 'clave1234' });
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    await vi.waitFor(() => expect(onRegistered).toHaveBeenCalledWith(payload.user, 'tkn'));
    const [, init] = registerCall(fetchMock)!;
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ email: 'ana@test.co', password_confirmation: 'clave1234', role: 'user' });
    expect(body.container_name).toBeUndefined(); // un usuario normal no envía datos de contenedor
  });

  it('muestra el error del servidor en el campo del correo (ya registrado)', async () => {
    backend({ ok: false, status: 422, body: { message: 'x', errors: { email: ['Ya existe una cuenta con este correo.'] } } });
    const user = userEvent.setup();
    render(<RegisterScreen onRegistered={vi.fn()} onLogin={vi.fn()} />);
    await fill(user, { name: 'Ana', email: 'ana@test.co', password: 'clave1234', confirm: 'clave1234' });
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('Ya existe una cuenta con este correo.')).toBeInTheDocument();
  });

  it('permite volver al inicio de sesión', async () => {
    const onLogin = vi.fn();
    const user = userEvent.setup();
    render(<RegisterScreen onRegistered={vi.fn()} onLogin={onLogin} />);
    await user.click(screen.getByRole('button', { name: 'Inicia sesión' }));
    expect(onLogin).toHaveBeenCalled();
  });
});

describe('RegisterScreen · rol contenedor', () => {
  it('al elegir Contenedor aparecen sus datos y son obligatorios', async () => {
    const fetchMock = backend({ ok: true, status: 201, body: {} });
    const user = userEvent.setup();
    render(<RegisterScreen onRegistered={vi.fn()} onLogin={vi.fn()} />);
    expect(screen.queryByLabelText('Nombre del contenedor')).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Contenedor/ }));
    expect(screen.getByLabelText('Nombre del contenedor')).toBeInTheDocument();
    await fill(user, { name: 'Ana', email: 'ana@test.co', password: 'clave1234', confirm: 'clave1234' });
    await user.click(screen.getByRole('button', { name: 'Crear cuenta de contenedor' }));
    expect(screen.getByText('Escribe el nombre del contenedor.')).toBeInTheDocument();
    expect(screen.getByText('Indica dónde está el contenedor.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tipo de residuo que recibe')).not.toBeInTheDocument();
    expect(registerCall(fetchMock)).toBeUndefined();
  });

  it('envía rol y datos del contenedor', async () => {
    const payload = { user: { id: '5', name: 'Ana', email: 'ana@test.co', role: 'contenedor', points: 0, level: 1, container: { id: 'CONT-006', name: 'Plaza' } }, token: 't' };
    const fetchMock = backend({ ok: true, status: 201, body: payload });
    const onRegistered = vi.fn();
    const user = userEvent.setup();
    render(<RegisterScreen onRegistered={onRegistered} onLogin={vi.fn()} />);
    await user.click(screen.getByRole('radio', { name: /Contenedor/ }));
    await fill(user, { name: 'Ana', email: 'ana@test.co', password: 'clave1234', confirm: 'clave1234' });
    await user.type(screen.getByLabelText('Nombre del contenedor'), 'Plaza');
    await user.type(screen.getByLabelText('Dirección o referencia'), 'Cra 7 # 32-16');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta de contenedor' }));
    await vi.waitFor(() => expect(onRegistered).toHaveBeenCalled());
    expect(JSON.parse(registerCall(fetchMock)![1].body as string)).toMatchObject({
      role: 'contenedor', container_name: 'Plaza', container_address: 'Cra 7 # 32-16',
    });
  });

  it('pide el código de registro solo si el servidor lo exige', async () => {
    backend({ ok: true, status: 201, body: {} }, true);
    const user = userEvent.setup();
    render(<RegisterScreen onRegistered={vi.fn()} onLogin={vi.fn()} />);
    await user.click(screen.getByRole('radio', { name: /Contenedor/ }));
    expect(await screen.findByLabelText('Código de registro')).toBeInTheDocument();
  });
});
