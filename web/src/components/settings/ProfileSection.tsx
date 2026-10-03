import { DragEvent, FormEvent, useRef, useState } from 'react';
import { useAuth } from '../../app/AuthProvider';
import { ApiError, profileService } from '../../services/api';
import { fileToAvatarDataUrl, validateAvatarFile } from '../../utils/image';
import { Avatar } from '../common/Avatar';
import { Icon } from '../Icon';

const ROLE_LABELS = { admin: 'Administrador', user: 'Usuario', contenedor: 'Contenedor inteligente' } as const;
type Notice = { ok: boolean; text: string } | null;

const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.userMessage : e instanceof Error ? e.message : fallback);

export function ProfileSection() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<Notice>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameNotice, setNameNotice] = useState<Notice>(null);

  if (!user) return null;
  const level = user.level;
  const toNext = 50 - (user.points % 50); // el backend sube de nivel cada 50 pts
  const progress = ((user.points % 50) / 50) * 100;
  const trimmed = name.trim().replace(/\s+/g, ' ');
  const nameError = trimmed.length < 2 ? 'Escribe al menos 2 caracteres.' : trimmed.length > 60 ? 'Máximo 60 caracteres.' : null;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setPhotoNotice(null);
    const invalid = validateAvatarFile(file);
    if (invalid) { setPhotoNotice({ ok: false, text: invalid }); return; }
    try {
      setPreview(await fileToAvatarDataUrl(file));
    } catch (e) {
      setPhotoNotice({ ok: false, text: errText(e, 'No se pudo procesar la imagen.') });
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void pick(e.dataTransfer.files[0]);
  };

  const savePhoto = async () => {
    if (!preview) return;
    setPhotoBusy(true);
    try {
      updateUser(await profileService.uploadAvatar(preview));
      setPreview(null);
      setPhotoNotice({ ok: true, text: 'Foto de perfil actualizada.' });
    } catch (e) {
      setPhotoNotice({ ok: false, text: errText(e, 'No se pudo guardar la foto.') });
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    setPhotoNotice(null);
    try {
      updateUser(await profileService.removeAvatar());
      setPhotoNotice({ ok: true, text: 'Foto eliminada.' });
    } catch (e) {
      setPhotoNotice({ ok: false, text: errText(e, 'No se pudo eliminar la foto.') });
    } finally {
      setPhotoBusy(false);
    }
  };

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (nameError || trimmed === user.name) return;
    setNameBusy(true);
    setNameNotice(null);
    try {
      const updated = await profileService.updateName(trimmed);
      updateUser(updated);
      setName(updated.name);
      setNameNotice({ ok: true, text: 'Nombre actualizado.' });
    } catch (e2) {
      setNameNotice({ ok: false, text: errText(e2, 'No se pudo actualizar el nombre.') });
    } finally {
      setNameBusy(false);
    }
  };

  return (
    <div className="st-stack">
      <section className="panel st-photo" aria-label="Foto de perfil">
        <h3 className="section-title">Foto de perfil</h3>
        <div
          className={`st-drop${dragging ? ' over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="st-photo-frame">
            {preview ? <img src={preview} alt="Vista previa de tu nueva foto" className="avatar-img" /> : <Avatar user={user} className="xl" />}
            <button type="button" className="st-camera" onClick={() => fileRef.current?.click()} aria-label="Elegir una foto" disabled={photoBusy}>
              <Icon name="camera" size={18} />
            </button>
          </div>
          <div className="st-photo-text">
            {preview ? (
              <>
                <b>Así se verá tu foto</b>
                <small>Se recorta al centro en formato cuadrado.</small>
                <div className="st-row">
                  <button type="button" className="btn btn-primary" onClick={savePhoto} disabled={photoBusy}>{photoBusy ? 'Guardando…' : 'Guardar foto'}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ''; }} disabled={photoBusy}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <b>Sube tu foto</b>
                <small>Arrastra una imagen aquí o elígela. JPG, PNG o WebP, hasta 8 MB.</small>
                <div className="st-row">
                  <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()} disabled={photoBusy}>Elegir imagen</button>
                  {user.avatar && <button type="button" className="st-link danger" onClick={removePhoto} disabled={photoBusy}>Quitar foto</button>}
                </div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Archivo de imagen" onChange={(e) => void pick(e.target.files?.[0])} />
        </div>
        {photoNotice && <div className={photoNotice.ok ? 'notice-ok' : 'alert-box'} role={photoNotice.ok ? 'status' : 'alert'}>{photoNotice.text}</div>}
      </section>

      <section className="panel" aria-label="Datos personales">
        <h3 className="section-title">Datos personales</h3>
        <form onSubmit={saveName} noValidate>
          <div className="field">
            <label htmlFor="st-name">Nombre</label>
            <input id="st-name" type="text" value={name} maxLength={60} onChange={(e) => { setName(e.target.value); setNameNotice(null); }} aria-invalid={!!nameError} aria-describedby={nameError ? 'st-name-err' : undefined} />
            {nameError && <p id="st-name-err" className="error-text">{nameError}</p>}
          </div>
          <div className="field">
            <label htmlFor="st-email">Correo electrónico</label>
            <input id="st-email" type="text" value={user.email} readOnly aria-readonly="true" className="readonly" />
            <small>El correo no se puede cambiar desde aquí.</small>
          </div>
          {nameNotice && <div className={nameNotice.ok ? 'notice-ok' : 'alert-box'} role={nameNotice.ok ? 'status' : 'alert'}>{nameNotice.text}</div>}
          <button type="submit" className="btn btn-primary" disabled={nameBusy || !!nameError || trimmed === user.name}>
            {nameBusy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </section>

      <section className="panel" aria-label="Progreso">
        <h3 className="section-title">Tu progreso</h3>
        <div className="st-level">
          <span className="st-level-badge">Nv. {level}</span>
          <div className="st-level-body">
            <div className="hero-track st-track"><div className="hero-fill" style={{ width: `${progress}%` }} /></div>
            <small>{user.points} puntos · {toNext} para el nivel {level + 1}</small>
          </div>
        </div>
        <p className="st-role">Rol: <b>{ROLE_LABELS[user.role ?? 'user']}</b></p>
      </section>
    </div>
  );
}
