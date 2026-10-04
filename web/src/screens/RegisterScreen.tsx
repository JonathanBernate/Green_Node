import { FormEvent, useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { passwordStrength } from '../components/settings/SecuritySection';
import { ApiError, authService, AuthUser } from '../services/api';

interface Props {
  onRegistered: (user: AuthUser, token: string) => void;
  onLogin: () => void;
  onTerms?: () => void;
}

type Role = 'user' | 'contenedor';
type Field = 'name' | 'email' | 'password' | 'confirm' | 'containerName' | 'containerAddress' | 'registrationCode';
type Values = Record<Field, string> & { role: Role };

const ROLES: { id: Role; icon: string; title: string; desc: string }[] = [
  { id: 'user', icon: 'user', title: 'Usuario', desc: 'Clasifica tus residuos, aprende y reporta incidencias.' },
  { id: 'contenedor', icon: 'box', title: 'Contenedor', desc: 'Cuenta de un contenedor inteligente: clasifica y reporta su ubicación.' },
];
const STRENGTH = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];

/** Valida en el cliente; el servidor sigue siendo la autoridad. */
export function validateRegister(
  v: Pick<Values, 'name' | 'email' | 'password' | 'confirm'> & Partial<Values>,
  codeRequired = false,
): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  const name = v.name.trim().replace(/\s+/g, ' ');
  if (name.length < 2) e.name = 'Escribe tu nombre (mínimo 2 caracteres).';
  else if (name.length > 60) e.name = 'El nombre no puede superar 60 caracteres.';
  if (!v.email.trim()) e.email = 'Escribe tu correo electrónico.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Ingresa un correo válido.';
  if (v.password.length < 8) e.password = 'Mínimo 8 caracteres.';
  else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) e.password = 'Combina letras y números.';
  if (v.confirm !== v.password) e.confirm = 'Las contraseñas no coinciden.';
  if (v.role === 'contenedor') {
    const cn = (v.containerName ?? '').trim();
    if (cn.length < 2) e.containerName = 'Escribe el nombre del contenedor.';
    else if (cn.length > 60) e.containerName = 'Máximo 60 caracteres.';
    const ca = (v.containerAddress ?? '').trim();
    if (ca.length < 3) e.containerAddress = 'Indica dónde está el contenedor.';
    else if (ca.length > 120) e.containerAddress = 'Máximo 120 caracteres.';
    if (codeRequired && !(v.registrationCode ?? '').trim()) e.registrationCode = 'Ingresa el código de registro.';
  }
  return e;
}

export function RegisterScreen({ onRegistered, onLogin, onTerms }: Props) {
  const [values, setValues] = useState<Values>({
    role: 'user', name: '', email: '', password: '', confirm: '',
    containerName: '', containerAddress: '', registrationCode: '',
  });
  const [codeRequired, setCodeRequired] = useState(false);
  useEffect(() => {
    authService.registerOptions().then((o) => setCodeRequired(o.container_code_required)).catch(() => undefined);
  }, []);
  const isContainer = values.role === 'contenedor';
  const [errors, setErrors] = useState<Partial<Record<Field, string>> & { general?: string }>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [f]: e.target.value }));
    if (errors[f]) setErrors((x) => ({ ...x, [f]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validateRegister(values, codeRequired);
    setErrors(v);
    if (Object.keys(v).length) return;
    setLoading(true);
    try {
      const { user, token } = await authService.register({
        name: values.name.trim().replace(/\s+/g, ' '),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        confirm: values.confirm,
        role: values.role,
        containerName: values.containerName.trim().replace(/\s+/g, ' '),
        containerAddress: values.containerAddress.trim().replace(/\s+/g, ' '),
        registrationCode: values.registrationCode.trim(),
      });
      onRegistered(user, token);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        // Errores por campo del servidor (p. ej. correo ya registrado)
        const server = (err.technical as { errors?: Record<string, string[]> } | undefined)?.errors ?? {};
        const map: Partial<Record<Field, string>> = {};
        const serverField: Record<string, Field> = {
          name: 'name', email: 'email', password: 'password', container_name: 'containerName',
          container_address: 'containerAddress', registration_code: 'registrationCode',
        };
        Object.entries(serverField).forEach(([key, f]) => { if (server[key]?.[0]) map[f] = server[key][0]; });
        setErrors(Object.keys(map).length ? map : { general: err.userMessage });
      } else {
        setErrors({ general: err instanceof ApiError ? err.userMessage : 'No fue posible crear la cuenta. Inténtalo nuevamente.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(values.password);
  const rules = [
    { ok: values.password.length >= 8, text: '8 caracteres o más' },
    { ok: /[A-Za-z]/.test(values.password) && /\d/.test(values.password), text: 'Letras y números' },
  ];
  const type = show ? 'text' : 'password';

  return (
    <div className="login-page register">
      <div className="login-hero">
        <span className="hero-blob blob-a" />
        <span className="hero-blob blob-b" />
        <div className="logo-section">
          <div className="logo-circle"><Icon name="leaf" size={38} stroke={1.8} /></div>
          <h1 className="logo-title">GreenNode</h1>
          <p className="logo-subtitle">Únete y aprende a separar tus residuos</p>
        </div>
      </div>

      <div className="login-sheet">
        <h2 className="form-title">Crea tu cuenta</h2>
        <p className="form-subtitle">Es gratis y toma menos de un minuto</p>

        <form onSubmit={submit} noValidate>
          <fieldset className="role-picker">
            <legend className="input-label">Tipo de cuenta</legend>
            <div className="role-grid" role="radiogroup" aria-label="Tipo de cuenta">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={values.role === r.id}
                  className={`role-card${values.role === r.id ? ' on' : ''}`}
                  onClick={() => { setValues((v) => ({ ...v, role: r.id })); setErrors({}); }}
                >
                  <span className="role-icon"><Icon name={r.icon} size={20} /></span>
                  <b>{r.title}</b>
                  <small>{r.desc}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-name">{isContainer ? 'Tu nombre (responsable)' : 'Nombre'}</label>
            <div className={`input-wrap ${errors.name ? 'error' : ''}`}>
              <Icon name="user" size={18} />
              <input id="reg-name" className="input-field" type="text" autoComplete="name" placeholder="Tu nombre" value={values.name} onChange={set('name')} maxLength={60} aria-invalid={!!errors.name} />
            </div>
            {errors.name && <p className="error-text" role="alert">{errors.name}</p>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-email">Correo electrónico</label>
            <div className={`input-wrap ${errors.email ? 'error' : ''}`}>
              <Icon name="mail" size={18} />
              <input id="reg-email" className="input-field" type="email" autoComplete="email" placeholder="tu@correo.com" value={values.email} onChange={set('email')} aria-invalid={!!errors.email} />
            </div>
            {errors.email && <p className="error-text" role="alert">{errors.email}</p>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-password">Contraseña</label>
            <div className={`input-wrap ${errors.password ? 'error' : ''}`}>
              <Icon name="lock" size={18} />
              <input id="reg-password" className="input-field" type={type} autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={values.password} onChange={set('password')} aria-invalid={!!errors.password} />
              <button type="button" className="show-password" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar contraseñas' : 'Mostrar contraseñas'} aria-pressed={show}>
                <Icon name={show ? 'eyeoff' : 'eye'} size={18} />
              </button>
            </div>
            {values.password && (
              <div className="pw-meter" role="status" aria-label={`Seguridad: ${STRENGTH[strength]}`}>
                <div className="pw-bars">{[0, 1, 2, 3].map((i) => <i key={i} className={i < strength ? `on s${strength}` : ''} />)}</div>
                <small>{STRENGTH[strength]}</small>
              </div>
            )}
            <ul className="reg-rules" aria-label="Requisitos">
              {rules.map((r) => <li key={r.text} className={r.ok ? 'ok' : ''}>{r.ok ? '✓' : '•'} {r.text}</li>)}
            </ul>
            {errors.password && <p className="error-text" role="alert">{errors.password}</p>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-confirm">Confirmar contraseña</label>
            <div className={`input-wrap ${errors.confirm ? 'error' : ''}`}>
              <Icon name="lock" size={18} />
              <input id="reg-confirm" className="input-field" type={type} autoComplete="new-password" placeholder="Repite tu contraseña" value={values.confirm} onChange={set('confirm')} aria-invalid={!!errors.confirm} />
            </div>
            {errors.confirm && <p className="error-text" role="alert">{errors.confirm}</p>}
          </div>

          {isContainer && (
            <section className="container-fields" aria-label="Datos del contenedor">
              <h3>Datos del contenedor</h3>
              <div className="input-group">
                <label className="input-label" htmlFor="reg-cname">Nombre del contenedor</label>
                <div className={`input-wrap ${errors.containerName ? 'error' : ''}`}>
                  <Icon name="box" size={18} />
                  <input id="reg-cname" className="input-field" type="text" placeholder="Ej. Plaza Central" value={values.containerName} onChange={set('containerName')} maxLength={60} aria-invalid={!!errors.containerName} />
                </div>
                {errors.containerName && <p className="error-text" role="alert">{errors.containerName}</p>}
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="reg-caddr">Dirección o referencia</label>
                <div className={`input-wrap ${errors.containerAddress ? 'error' : ''}`}>
                  <Icon name="map" size={18} />
                  <input id="reg-caddr" className="input-field" type="text" placeholder="Ej. Cra 7 # 32-16, frente al parque" value={values.containerAddress} onChange={set('containerAddress')} maxLength={120} aria-invalid={!!errors.containerAddress} />
                </div>
                {errors.containerAddress && <p className="error-text" role="alert">{errors.containerAddress}</p>}
              </div>
              {codeRequired && (
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-code">Código de registro</label>
                  <div className={`input-wrap ${errors.registrationCode ? 'error' : ''}`}>
                    <Icon name="lock" size={18} />
                    <input id="reg-code" className="input-field" type="text" autoComplete="off" placeholder="Te lo entrega el administrador" value={values.registrationCode} onChange={set('registrationCode')} aria-invalid={!!errors.registrationCode} />
                  </div>
                  {errors.registrationCode && <p className="error-text" role="alert">{errors.registrationCode}</p>}
                </div>
              )}
              <p className="inference-meta">Se le asignará un identificador automático. Al iniciar sesión, el dispositivo pedirá permiso de ubicación para aparecer en el mapa.</p>
            </section>
          )}

          {errors.general && <div className="alert-box" role="alert">{errors.general}</div>}

          <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
            {loading ? <div className="spinner" /> : isContainer ? 'Crear cuenta de contenedor' : 'Crear cuenta'}
          </button>
        </form>

        <p className="legal-note">
          Al crear tu cuenta aceptas los{' '}
          <button type="button" className="link-btn" onClick={onTerms}>Términos y condiciones</button>.
        </p>

        <div className="footer">
          ¿Ya tienes cuenta? <button type="button" className="link-btn" onClick={onLogin}>Inicia sesión</button>
        </div>
      </div>
    </div>
  );
}
