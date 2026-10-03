import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { useAuth } from '../../app/AuthProvider';
import { ApiError, AuthSession, profileService, sessionService } from '../../services/api';
import { formatAgo } from '../../utils/status';
import { Icon } from '../Icon';

/** 0–4 según longitud y variedad de caracteres. */
export function passwordStrength(p: string): number {
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;
  return Math.min(score, 4);
}
const STRENGTH = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];

function PasswordField({ id, label, value, onChange, autoComplete, error }: {
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string; error?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={`sec-input${error ? ' invalid' : ''}`}>
        <Icon name="lock" size={18} />
        <input id={id} type={shown ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} />
        <button type="button" className="sec-eye" onClick={() => setShown(!shown)} aria-label={shown ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} aria-pressed={shown}>
          <Icon name={shown ? 'eyeoff' : 'eye'} size={18} />
        </button>
      </div>
      {error && <p id={`${id}-err`} className="error-text">{error}</p>}
    </div>
  );
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={ok ? 'ok' : ''}>
      <span className="sec-rule-dot" aria-hidden="true">{ok ? <Icon name="check" size={12} stroke={3} /> : null}</span>
      <span>{children}<span className="sr-only">{ok ? ' (cumplido)' : ' (pendiente)'}</span></span>
    </li>
  );
}

function DeviceIcon({ device }: { device: string }) {
  return <Icon name={/iOS|Android/.test(device) ? 'phone' : 'device'} size={20} />;
}

function SessionRow({ s, onRevoke, busy }: { s: AuthSession; onRevoke: (id: number) => void; busy: boolean }) {
  return (
    <li className={`sec-session${s.current ? ' current' : ''}`}>
      <span className="sec-device"><DeviceIcon device={s.device} /></span>
      <div className="sec-session-body">
        <b>{s.device} {s.current && <span className="sec-here">Este dispositivo</span>}</b>
        <small>{s.current ? 'Activa ahora' : `Última actividad ${formatAgo(s.last_used_at ?? undefined)}`}</small>
      </div>
      {!s.current && (
        <button type="button" className="st-link danger" disabled={busy} onClick={() => onRevoke(s.id)} aria-label={`Cerrar sesión de ${s.device}`}>Cerrar</button>
      )}
    </li>
  );
}

export function SecuritySection() {
  const { logout } = useAuth();
  const qc = useQueryClient();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const sessions = useQuery({ queryKey: ['sessions'], queryFn: () => sessionService.list(), retry: false });
  const revoke = useMutation({
    mutationFn: (id: number) => sessionService.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
  const revokeOthers = useMutation({
    mutationFn: () => sessionService.revokeOthers(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const list = sessions.data ?? [];
  const others = list.filter((s) => !s.current);

  const strength = passwordStrength(next);
  const rules = {
    length: next.length >= 8,
    letter: /[A-Za-z]/.test(next),
    number: /\d/.test(next),
    mixed: /[a-z]/.test(next) && /[A-Z]/.test(next) && /[^A-Za-z0-9]/.test(next),
  };
  const match = confirm.length > 0 && confirm === next;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (!current) v.current = 'Escribe tu contraseña actual.';
    if (!rules.length) v.next = 'Mínimo 8 caracteres.';
    else if (!rules.letter || !rules.number) v.next = 'Combina letras y números.';
    if (confirm !== next) v.confirm = 'Las contraseñas no coinciden.';
    setErrors(v);
    setNotice(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await profileService.changePassword({ current, next, confirm });
      setCurrent(''); setNext(''); setConfirm('');
      setNotice({ ok: true, text: 'Contraseña actualizada. Cerramos tus otras sesiones por seguridad.' });
      void qc.invalidateQueries({ queryKey: ['sessions'] });
    } catch (err) {
      setNotice({ ok: false, text: err instanceof ApiError ? err.userMessage : 'No se pudo cambiar la contraseña.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="st-stack sec">
      <section className="sec-hero" aria-label="Resumen de seguridad">
        <span className="sec-shield"><Icon name="shield" size={28} /></span>
        <div>
          <b>Protege tu cuenta</b>
          <small>Usa una contraseña única y revisa desde dónde has iniciado sesión.</small>
        </div>
        <dl className="sec-hero-stats">
          <div><dd>{sessions.isSuccess ? list.length : '—'}</dd><dt>{list.length === 1 ? 'sesión activa' : 'sesiones activas'}</dt></div>
        </dl>
      </section>

      <section className="panel" aria-label="Cambiar contraseña">
        <h3 className="section-title">Cambiar contraseña</h3>
        <form onSubmit={submit} noValidate>
          <PasswordField id="pw-current" label="Contraseña actual" value={current} onChange={setCurrent} autoComplete="current-password" error={errors.current} />
          <div className="sec-divider" />
          <PasswordField id="pw-new" label="Nueva contraseña" value={next} onChange={setNext} autoComplete="new-password" error={errors.next} />

          <div className="pw-meter" role="status" aria-label={next ? `Seguridad: ${STRENGTH[strength]}` : 'Seguridad de la contraseña'}>
            <div className="pw-bars">{[0, 1, 2, 3].map((i) => <i key={i} className={next && i < strength ? `on s${strength}` : ''} />)}</div>
            <small>{next ? STRENGTH[strength] : ''}</small>
          </div>
          <ul className="sec-rules" aria-label="Requisitos de la contraseña">
            <Rule ok={rules.length}>Al menos 8 caracteres</Rule>
            <Rule ok={rules.letter && rules.number}>Letras y números</Rule>
            <Rule ok={rules.mixed}>Mayúsculas, minúsculas y símbolo <em>(recomendado)</em></Rule>
          </ul>

          <PasswordField id="pw-confirm" label="Confirmar nueva contraseña" value={confirm} onChange={setConfirm} autoComplete="new-password" error={errors.confirm} />
          {confirm && !errors.confirm && (
            <p className={`sec-match${match ? ' ok' : ''}`} role="status">{match ? '✓ Las contraseñas coinciden' : 'Aún no coinciden'}</p>
          )}

          {notice && <div className={notice.ok ? 'notice-ok' : 'alert-box'} role={notice.ok ? 'status' : 'alert'}>{notice.text}</div>}
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Actualizando…' : 'Actualizar contraseña'}</button>
        </form>
      </section>

      <section className="panel" aria-label="Sesiones activas">
        <div className="sec-sessions-head">
          <h3 className="section-title">Sesiones activas</h3>
          {others.length > 0 && (
            <button type="button" className="st-link danger" disabled={revokeOthers.isPending} onClick={() => revokeOthers.mutate()}>
              {revokeOthers.isPending ? 'Cerrando…' : `Cerrar las otras (${others.length})`}
            </button>
          )}
        </div>
        {sessions.isLoading && <p className="inference-meta">Cargando sesiones…</p>}
        {sessions.isError && <p className="inference-meta">No se pudieron cargar tus sesiones.</p>}
        {sessions.isSuccess && (
          <ul className="sec-sessions">
            {list.map((s) => <SessionRow key={s.id} s={s} busy={revoke.isPending} onRevoke={(id) => revoke.mutate(id)} />)}
          </ul>
        )}
        {sessions.isSuccess && others.length === 0 && <p className="inference-meta">Solo tienes abierta esta sesión.</p>}
        {(revoke.isError || revokeOthers.isError) && <div className="alert-box" role="alert">No se pudo cerrar la sesión. Inténtalo de nuevo.</div>}
      </section>

      <section className="sec-logout" aria-label="Cerrar sesión">
        <div>
          <b>Cerrar sesión en este dispositivo</b>
          <small>Tendrás que volver a ingresar tu correo y contraseña.</small>
        </div>
        <button type="button" className="btn btn-outline" onClick={logout}>
          <Icon name="logout" size={18} /> Cerrar sesión
        </button>
      </section>
    </div>
  );
}
