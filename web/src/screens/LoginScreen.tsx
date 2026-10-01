import React, { useState, FormEvent } from 'react';
import { Icon } from '../components/Icon';

interface Props {
  onLogin: (user: { id: string; name: string; email: string; points: number; level: number }, token: string) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingresa un correo válido';
    }
    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json() as Record<string, unknown>;
      if (!response.ok) {
        const errors = data?.errors as Record<string, string[]> | undefined;
        const message = (data?.message as string) || errors?.email?.[0] || 'Credenciales incorrectas';
        setErrors({ general: message });
        setLoading(false);
        return;
      }
      localStorage.setItem('auth_token', data.token as string);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      onLogin(data.user as { id: string; name: string; email: string; points: number; level: number }, data.token as string);
    } catch {
      setErrors({ general: 'Error al conectar con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <span className="hero-blob blob-a" />
        <span className="hero-blob blob-b" />
        <div className="logo-section">
          <div className="logo-circle">
            <Icon name="leaf" size={38} stroke={1.8} />
          </div>
          <h1 className="logo-title">GreenNode</h1>
          <p className="logo-subtitle">Clasifica, recicla y cuida el planeta con IA</p>
        </div>
      </div>

      <div className="login-sheet">
        <h2 className="form-title">Bienvenido de nuevo</h2>
        <p className="form-subtitle">Inicia sesión para continuar</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label className="input-label">Correo electrónico</label>
            <div className={`input-wrap ${errors.email ? 'error' : ''}`}>
              <Icon name="mail" size={18} />
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="tu@correo.com"
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <div className={`input-wrap ${errors.password ? 'error' : ''}`}>
              <Icon name="lock" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                value={password}
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          {errors.general && <div className="alert-box">{errors.general}</div>}

          <button type="button" className="forgot-link">
            ¿Olvidaste tu contraseña?
          </button>

          <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
            {loading ? <div className="spinner" /> : 'Iniciar sesión'}
          </button>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">o continúa con</span>
            <div className="divider-line" />
          </div>

          <div className="social-row">
            <button type="button" className="btn btn-outline">Google</button>
            <button type="button" className="btn btn-outline">Apple</button>
          </div>
        </form>

        <div className="footer">
          ¿No tienes cuenta? <a onClick={() => {}}>Regístrate</a>
        </div>
      </div>
    </div>
  );
}
