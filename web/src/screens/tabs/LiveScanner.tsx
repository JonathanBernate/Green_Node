import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { EventPanel } from '../../components/waste/EventPanel';
import { TargetFrame } from '../../components/waste/TargetFrame';
import { targetCrop } from '../../lib/targetFrame';
import { BinResult } from '../../components/waste/BinResult';
import { useAppStore } from '../../lib/appStore';
import { BIN_COLORS, BIN_LABELS, Bin, WasteType } from '../../lib/domain';
import { appMetrics } from '../../services/api';
import {
  GROUP_COLORS,
  GROUP_ICONS,
  LABEL_ES,
  LiveClassifierClient,
  LivePrediction,
  LiveSmoother,
  LiveStatus,
  WasteGroup,
  binForLive,
} from '../../lib/liveClassifier';

const FRAME_INTERVAL_MS = 350;
const FRAME_SIDE = 320; // lado del recorte (el modelo lo reescala a 224)
const MIN_CONFIDENCE = 0.5; // sobre el promedio de los últimos fotogramas, no sobre uno solo

interface Shown {
  label: string;
  group: WasteGroup;
  confidence: number;
  bin: Bin;
  wasteType: WasteType | null;
}

/**
 * Clasificación en vivo: abre la cámara al montarse y clasifica cada frame
 * con el modelo de Hugging Face servido por el backend Python (/realtime).
 */
export function LiveScanner() {
  const { addClassification } = useAppStore();
  const [saved, setSaved] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [shown, setShown] = useState<Shown | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [model, setModel] = useState<string | undefined>();
  const [top3, setTop3] = useState<LivePrediction['top3']>([]);

  const clientRef = useRef<LiveClassifierClient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Suavizado: votación ponderada sobre los últimos fotogramas
  const smootherRef = useRef(new LiveSmoother());

  const handleResult = (p: LivePrediction) => {
    setLatency(p.inference_ms);
    appMetrics.record('inference:live', p.inference_ms, true);
    if (p.model) setModel(p.model);
    setTop3(p.top3);
    const smooth = smootherRef.current.push(p);
    if (!smooth || smooth.confidence < MIN_CONFIDENCE) {
      setShown(null);
      return;
    }
    const pred = smooth.prediction;
    setShown((prev) => {
      if (prev?.label !== smooth.label) setSaved(false);
      return {
        label: smooth.label,
        group: pred.group,
        confidence: smooth.confidence,
        bin: binForLive(pred),
        wasteType: (pred.waste_type as WasteType | null) ?? null,
      };
    });
  };

  const save = () => {
    if (!shown?.wasteType) return;
    addClassification({
      id: `cls_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      wasteType: shown.wasteType,
      confidence: shown.confidence,
      probabilities: [],
      isLowConfidence: shown.confidence < 0.5,
      inferenceTimeMs: latency ?? 0,
      timestamp: new Date().toISOString(),
      feedback: null,
      autoConfirmed: false,
      correctedType: null,
      model,
    });
    setSaved(true);
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
      // Solo el contenido del marco de enfoque llega al modelo
      const { sx, sy, side } = targetCrop(v.videoWidth, v.videoHeight, v.clientWidth, v.clientHeight);
      canvas.width = canvas.height = FRAME_SIDE;
      canvas.getContext('2d')?.drawImage(v, sx, sy, side, side, 0, 0, FRAME_SIDE, FRAME_SIDE);
      canvas.toBlob((blob) => blob && client.send(blob), 'image/jpeg', 0.7);
    }, FRAME_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      client.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const color = shown ? BIN_COLORS[shown.bin] : undefined;

  return (
    <div className="live-scanner">
      <div className="camera-live">
        <video ref={videoRef} className="camera-video" playsInline muted />

        {cameraOn && <TargetFrame color={color} hint={shown ? '' : 'Coloca el residuo dentro del marco'} />}

        {cameraOn && (
          <div className="live-badge" style={{ borderColor: color ?? 'rgba(255,255,255,0.4)' }}>
            {shown ? (
              <>
                <span className="live-group live-bin">
                  <i className="live-bin-dot" style={{ background: color }} aria-hidden="true" />
                  {BIN_LABELS[shown.bin]}
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
                <span className="camera-icon"><Icon name="camera" size={40} /></span>
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
        {status === 'open' && <>🟢 Modelo activo{latency !== null && ` · ${latency} ms`}</>}
        {status === 'connecting' && <>🟡 Conectando con el servicio de IA...</>}
        {status === 'closed' && <>🔴 Sin conexión con el servicio de IA (reintentando)</>}
      </p>

      {shown && (
        <div className="live-bin-panel">
          <BinResult bin={shown.bin} />
          {shown.wasteType && (
            <button type="button" className="btn btn-outline" onClick={save} disabled={saved}>
              {saved ? '✓ Guardado en tu historial' : 'Guardar en mi historial'}
            </button>
          )}
        </div>
      )}

      {shown && (
        <EventPanel
          key={shown.label}
          classification={shown.label}
          confidence={shown.confidence}
          model={model}
          inferenceTimeMs={latency ?? undefined}
        />
      )}

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
