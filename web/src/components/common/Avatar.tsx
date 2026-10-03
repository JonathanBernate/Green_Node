import type { AuthUser } from '../../services/api';

interface Props {
  user: Pick<AuthUser, 'name' | 'avatar'> | null;
  /** Clases extra: 'sm', etc. */
  className?: string;
}

/** Foto de perfil, o la inicial del nombre si no hay foto. */
export function Avatar({ user, className = '' }: Props) {
  const initial = (user?.name ?? '?').trim().charAt(0).toUpperCase();
  return (
    <span className={`avatar ${className}`.trim()}>
      {user?.avatar ? <img src={user.avatar} alt="" className="avatar-img" /> : initial}
    </span>
  );
}
