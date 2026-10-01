import { useState } from 'react';
import { useAuth } from '../../app/AuthProvider';
import { buildEvent, classificationService } from '../../services/api';
import type { StoredEvent } from '../../types';
import { iotSimulator } from '../../lib/iotSimulator';
import { config } from '../../config/env';

interface Props {
  classification: string;
  confidence: number;
  model?: string;
  inferenceTimeMs?: number;
  /** Si existe, no se permite enviar (p. ej. resultado simulado). */
  disabledReason?: string;
}

const DELIVERY_TEXT: Record<StoredEvent['delivery'], string> = {
  sent: 'Evento enviado al sistema.',
  pending: 'No se pudo enviar ahora. Quedó en cola local y se reintentará.',
  'stored-local': 'Modo simulación: el evento quedó guardado en este navegador (no se envió a ningún servidor).',
};

/** Convierte una clasificación en evento IoT. La ubicación es opcional y requiere consentimiento. */
export function EventPanel({ classification, confidence, model, inferenceTimeMs, disabledReason }: Props) {
  const { user } = useAuth();
  const [withLocation, setWithLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [result, setResult] = useState<StoredEvent | null>(null);
  const [busy, setBusy] = useState(false);

  const toggleLocation = (checked: boolean) => {
    setWithLocation(checked);
    setLocMsg(null);
    if (!checked) { setLocation(null); return; }
    if (!('geolocation' in navigator)) {
      setLocMsg('Tu dispositivo no permite obtener la ubicación. Se enviará sin ella.');
      setWithLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setLocation({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }),
      () => {
        setLocMsg('No se concedió el permiso de ubicación. Se enviará sin ella.');
        setWithLocation(false);
      },
      { timeout: 8000, maximumAge: 60000 },
    );
  };

  const send = async () => {
    setBusy(true);
    const event = buildEvent({
      userId: user?.id ?? 'anon',
      classification,
      confidence,
      model,
      inferenceTimeMs,
      location: withLocation ? location ?? undefined : undefined,
    });
    const stored = await classificationService.sendEvent(event);
    iotSimulator.publishClassification(classification, confidence);
    setResult(stored);
    setBusy(false);
  };

  if (disabledReason) {
    return <div className="event-panel"><p className="inference-meta">{disabledReason}</p></div>;
  }

  return (
    <div className="event-panel">
      <label className="check-row">
        <input type="checkbox" checked={withLocation} onChange={(e) => toggleLocation(e.target.checked)} disabled={!!result} />
        <span>
          Incluir mi ubicación aproximada
          <small>Se usa solo para ubicar el evento en el mapa. Es opcional.</small>
        </span>
      </label>
      {withLocation && !location && <p className="inference-meta" role="status">Obteniendo ubicación…</p>}
      {locMsg && <p className="inference-meta" role="status">{locMsg}</p>}

      {result ? (
        <>
          <p className="notice-ok" role="status">{DELIVERY_TEXT[result.delivery]}</p>
          <details>
            <summary>Ver contenido del evento</summary>
            <pre className="payload">{JSON.stringify(result.event, null, 2)}</pre>
          </details>
        </>
      ) : (
        <button className="btn btn-outline" onClick={send} disabled={busy || (withLocation && !location)}>
          {busy ? 'Enviando…' : config.useMockData ? 'Registrar evento (simulación)' : 'Enviar evento al sistema'}
        </button>
      )}
    </div>
  );
}
