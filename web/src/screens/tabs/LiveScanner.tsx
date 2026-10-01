import { useEffect, useRef, useState } from 'react';
import {
  GROUP_COLORS,
  GROUP_ICONS,
  GROUP_LABELS,
  LABEL_ES,
  LiveClassifierClient,
  LivePrediction,
  LiveStatus,
  WasteGroup,
} from '../../lib/liveClassifier';

const FRAME_INTERVAL_MS = 350;
const FRAME_WIDTH = 320;
const MIN_CONFIDENCE = 0.6;
const STABLE_FRAMES = 2; // predicciones consecutivas iguales para cambiar la etiqueta

interface Shown {
  label: string;
  group: WasteGroup;
  confidence: number;
}

/**
 * Clasificación en vivo: abre la cámara al montarse y clasifica cada frame
 * con el modelo de Hugging Face servido por el backend Python (/realtime).
 */
export function LiveScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [shown, setShown] = useState<Shown | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [top3, setTop3] = useState<LivePrediction['top3']>([]);

  const clientRef = useRef<LiveClassifierClient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Suavizado: candidato actual y cuántas veces seguidas se ha repetido
  const candidateRef = useRef<{ label: string; count: number }>({ label: '', count: 0 });

  const handleResult = (p: LivePrediction) => {
    setLatency(p.inference_ms);
    setTop3(p.top3);
    if (p.confidence < MIN_CONFIDENCE) {
      candidateRef.current = { label: '', count: 0 };
      setShown(null);
      return;
    }
    const c = candidateRef.current;
    candidateRef.current = c.label === p.label ? { label: p.label, count: c.count + 1 } : { label: p.label, count: 1 };
    if (candidateRef.current.count >= STABLE_FRAMES) {
      setShown({ label: p.label, group: p.group, confidence: p.confidence });
    }
  };

  // Cámara
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
        setCameraOn(true);
      } catch (err) {
        const name = (err as Error)?.name;
        setCameraError(
          name === 'NotAllowedError'
            ? 'Permiso de cámara denegado. Actívalo en el navegador.'
            : name === 'NotFoundError'
              ? 'No se encontró ninguna cámara.'
              : 'No se pudo acceder a la cámara (en móvil requiere HTTPS).',
        );
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // WebSocket + bucle de captura
  useEffect(() => {
    const client = new LiveClassifierClient(handleResult, setStatus);
    clientRef.current = client;
    client.connect();

    const canvas = document.createElement('canvas');
    const timer = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.videoWidth === 0 || v.readyState < 2) return;
      canvas.width = FRAME_WIDTH;
      canvas.height = Math.round((FRAME_WIDTH * v.videoHeight) / v.videoWidth);
      canvas.getContext('2d')?.drawImage(v, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => blob && client.send(blob), 'image/jpeg', 0.7);
    }, FRAME_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      client.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const color = shown ? GROUP_COLORS[shown.group] : undefined;

  return (
    <div className="live-scanner">
      <div className="camera-live">
        <video ref={videoRef} className="camera-video" playsInline muted />

        {cameraOn && (
          <div className="live-badge" style={{ borderColor: color ?? 'rgba(255,255,255,0.4)' }}>
            {shown ? (
              <>
                <span className="live-group" style={{ color }}>
                  {GROUP_ICONS[shown.group]} {GROUP_LABELS[shown.group]}
                </span>
                <span className="live-label">
                  {LABEL_ES[shown.label] ?? shown.label} · {(shown.confidence * 100).toFixed(0)}%
                </span>
              </>
            ) : (
              <span className="live-label">Apunta a un residuo</span>
            )}
          </div>
        )}

        {!cameraOn && (
          <div className="camera-off">
            {cameraError ? (
              <>
                <span className="camera-icon">🚫</span>
                <p className="camera-error">{cameraError}</p>
              </>
            ) : (
              <>
                <div className="spinner-dark" />
                <p>Iniciando cámara...</p>
              </>
            )}
          </div>
        )}
      </div>

      <p className="live-status">
        {status === 'open' && <>🟢 IA conectada{latency !== null && ` · ${latency} ms`}</>}
        {status === 'connecting' && <>🟡 Conectando con el servicio de IA...</>}
        {status === 'closed' && <>🔴 Sin conexión con el servicio de IA (reintentando)</>}
      </p>

      {top3.length > 0 && (
        <div className="prob-list">
          {top3.map((t) => (
            <div className="prob-row" key={t.label}>
              <span className="prob-label">
                {GROUP_ICONS[t.group]} {LABEL_ES[t.label] ?? t.label}
              </span>
              <div className="prob-track">
                <div
                  className="prob-fill"
                  style={{ width: `${t.confidence * 100}%`, background: GROUP_COLORS[t.group] }}
                />
              </div>
              <span className="prob-val">{(t.confidence * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
