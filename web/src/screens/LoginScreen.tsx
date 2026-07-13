import React, { useState, FormEvent } from 'react';

interface Props {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1200);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-section">
          <div className="logo-circle">♻️</div>
          <h1 className="logo-title">GreenNode</h1>
          <p className="logo-subtitle">Gestión inteligente de residuos</p>
        </div>

        <div className="form-card">
          <h2 className="form-title">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Correo electrónico</label>
              <input
                type="email"
                className={`input-field ${errors.email ? 'error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            <div className="input-group password-wrapper">
              <label className="input-label">Contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`input-field ${errors.password ? 'error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <button type="button" className="forgot-link">
              ¿Olvidaste tu contraseña?
            </button>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? <div className="spinner" /> : 'Iniciar Sesión'}
            </button>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">o</span>
              <div className="divider-line" />
            </div>

            <button type="button" className="btn btn-outline btn-large">
              Continuar con Google
            </button>

            <div style={{ height: 12 }} />

            <button type="button" className="btn btn-secondary btn-large">
              Continuar con Apple
            </button>
          </form>

          <div className="footer">
            ¿No tienes cuenta?{' '}
            <a onClick={() => {}}>Regístrate aquí</a>
          </div>
        </div>
      </div>
    </div>
  );
}
