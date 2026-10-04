import React, { useState, FormEvent } from 'react';
import { Icon } from '../components/Icon';
import { ApiError, authService, AuthUser } from '../services/api';

interface Props {
  onLogin: (user: AuthUser, token: string) => void;
  onRegister?: () => void;
  onTerms?: () => void;
}

export function LoginScreen({ onLogin, onRegister, onTerms }: Props) {
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
      const { user, token } = await authService.login(email.trim(), password);
      onLogin(user, token);
    } catch (err) {
      setErrors({
        general: err instanceof ApiError ? err.userMessage : 'No fue posible iniciar sesión. Inténtalo nuevamente.',
      });
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
            <label className="input-label" htmlFor="login-email">Correo electrónico</label>
            <div className={`input-wrap ${errors.email ? 'error' : ''}`}>
              <Icon name="mail" size={18} />
              <input
                id="login-email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="tu@correo.com"
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="error-text" role="alert">{errors.email}</p>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="login-password">Contraseña</label>
            <div className={`input-wrap ${errors.password ? 'error' : ''}`}>
              <Icon name="lock" size={18} />
              <input
                id="login-password"
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
            {errors.password && <p className="error-text" role="alert">{errors.password}</p>}
          </div>

          {errors.general && <div className="alert-box" role="alert">{errors.general}</div>}

          <button type="button" className="forgot-link">
            ¿Olvidaste tu contraseña?
          </button>

          <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
            {loading ? <div className="spinner" /> : 'Iniciar sesión'}
          </button>
        </form>

        <p className="legal-note">
          Al continuar aceptas los{' '}
          <button type="button" className="link-btn" onClick={onTerms}>Términos y condiciones</button>
          {' '}de GreenNode.
        </p>

        <div className="footer">
          ¿No tienes cuenta? <button type="button" className="link-btn" onClick={onRegister}>Regístrate</button>
        </div>
      </div>
    </div>
  );
}
