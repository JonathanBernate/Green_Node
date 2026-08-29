import React, { useEffect, useRef, useState } from 'react';
import {
  classifyWasteSimulated,
  ClassificationResult,
  WASTE_TYPE_LABELS,
  WASTE_TYPE_COLORS,
  WASTE_TYPE_ICONS,
  WASTE_DISPOSAL_TIP,
  WasteType,
} from '../../lib/domain';
import { useAppStore } from '../../lib/appStore';
import { iotSimulator } from '../../lib/iotSimulator';
import { isModelAvailable, classifyWithModel } from '../../lib/tfClassifier';

type Mode = 'camera' | 'upload';
type Status = 'idle' | 'classifying' | 'done';

export function ScanTab() {
  const { addClassification, setClassificationFeedback } = useAppStore();
  const [mode, setMode] = useState<Mode>('camera');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Modo del modelo: null = aún no sabemos, true = real (TFJS), false = simulado
  const [realModel, setRealModel] = useState<boolean | null>(null);
  const [lastWasReal, setLastWasReal] = useState(false);

  // Detecta al montar si hay un modelo real disponible en /model/
  useEffect(() => {
    isModelAvailable().then(setRealModel);
  }, []);

  // Cámara
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const deviceIndexRef = useRef(0);
  const switchingRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /**
   * Pide getUserMedia reintentando ante NotReadableError, que en Android ocurre
   * cuando el sensor aún no se ha liberado tras cerrar la otra cámara.
   */
  const getStreamWithRetry = async (
    constraints: MediaStreamConstraints,
    retries = 3,
  ): Promise<MediaStream> => {
    let lastErr: unknown = null;
    for (let i = 0; i <= retries; i++) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        lastErr = err;
        const name = (err as Error)?.name;
        // Solo tiene sentido reintentar si el hardware está ocupado/liberándose
        if (name === 'NotReadableError' || name === 'AbortError') {
          console.warn(`[GreenNode] [Camera] Sensor ocupado, reintento ${i + 1}/${retries}...`);
          await sleep(400 * (i + 1));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  };

  /**
   * Aplica un stream ya obtenido al elemento <video>.
   */
  const attachStream = async (stream: MediaStream) => {
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
      } catch {
        /* play() puede rechazar si el usuario aún no interactúa; se ignora */
      }
    }
    setCameraOn(true);
    setCameraError(null);
  };

  /**
   * Intenta abrir la cámara. Estrategia en cascada para máxima compatibilidad
   * en móviles:
   *  1) Por deviceId exacto (si se conoce)
   *  2) Por facingMode ideal
   *  3) Cualquier cámara disponible (video: true)
   */
  const openCamera = async (opts: {
    deviceId?: string;
    facing?: 'environment' | 'user';
    settleMs?: number;
  }) => {
    stopCamera();
    // Da tiempo al hardware a liberar el sensor antes de reabrir (clave en Android)
    if (opts.settleMs) await sleep(opts.settleMs);

    const attempts: MediaStreamConstraints[] = [];
    if (opts.deviceId) attempts.push({ video: { deviceId: { exact: opts.deviceId } }, audio: false });
    if (opts.facing) attempts.push({ video: { facingMode: { ideal: opts.facing } }, audio: false });
    attempts.push({ video: true, audio: false });

    let lastErr: unknown = null;
    for (const constraints of attempts) {
      try {
        const stream = await getStreamWithRetry(constraints);
        await attachStream(stream);
        console.info('[GreenNode] [Camera] Cámara activa');

        // Refresca la lista de dispositivos (ahora con labels, ya con permiso)
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cams = devices.filter((d) => d.kind === 'videoinput');
          setVideoDevices(cams);
          // Sincroniza el índice actual con el device en uso
          const track = stream.getVideoTracks()[0];
          const activeId = track?.getSettings().deviceId;
          const idx = cams.findIndex((c) => c.deviceId === activeId);
          if (idx >= 0) deviceIndexRef.current = idx;
        } catch {
          /* ignore */
        }
        return true;
      } catch (err) {
        lastErr = err;
        console.warn('[GreenNode] [Camera] Intento fallido:', (err as Error)?.name || err);
      }
    }

    console.warn('[GreenNode] [Camera] No se pudo acceder a la cámara:', lastErr);
    const name = (lastErr as Error)?.name;
    let msg = 'No se pudo acceder a la cámara. Revisa los permisos o usa "Adjuntar imagen".';
    if (name === 'NotAllowedError') msg = 'Permiso de cámara denegado. Actívalo en el navegador o usa "Adjuntar imagen".';
    else if (name === 'NotFoundError') msg = 'No se encontró ninguna cámara en el dispositivo.';
    else if (name === 'NotReadableError') msg = 'La cámara está en uso por otra app. Ciérrala e intenta de nuevo.';
    setCameraError(msg);
    setCameraOn(false);
    return false;
  };

  const startCamera = () => openCamera({ facing: facingMode });

  /**
   * Cambia entre cámaras. Recorre la lista real de dispositivos por deviceId,
   * que es lo más fiable en Android. Si falla, vuelve a la que funcionaba.
   */
  const flipCamera = async () => {
    if (switchingRef.current) return;
    switchingRef.current = true;
    try {
      let cams = videoDevices;
      if (cams.length === 0) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        cams = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(cams);
      }

      if (cams.length > 1) {
        const prevIndex = deviceIndexRef.current;
        const nextIndex = (prevIndex + 1) % cams.length;
        const target = cams[nextIndex];
        console.info(`[GreenNode] [Camera] Cambiando a cámara: ${target.label || target.deviceId}`);
        const ok = await openCamera({ deviceId: target.deviceId, settleMs: 350 });
        if (ok) {
          deviceIndexRef.current = nextIndex;
          // Ajusta el espejo: heurística por label (frontal suele decir "front")
          const isFront = /front|frontal|user|self/i.test(target.label);
          setFacingMode(isFront ? 'user' : 'environment');
        } else {
          // Si no se pudo abrir la otra, recupera la que estaba funcionando
          console.warn('[GreenNode] [Camera] Flip falló, restaurando cámara anterior');
          const prev = cams[prevIndex];
          if (prev) await openCamera({ deviceId: prev.deviceId, settleMs: 350 });
        }
      } else {
        // Solo hay 1 device listado: alterna por facingMode como respaldo
        const next = facingMode === 'environment' ? 'user' : 'environment';
        console.info(`[GreenNode] [Camera] Cambiando por facingMode a ${next}`);
        const ok = await openCamera({ facing: next, settleMs: 350 });
        if (ok) setFacingMode(next);
      }
    } finally {
      switchingRef.current = false;
    }
  };

  const hasMultipleCameras = videoDevices.length > 1;

  // Enciende la cámara al entrar en modo cámara; la apaga al salir/desmontar
  useEffect(() => {
    if (mode === 'camera' && status === 'idle' && !imageSrc) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, status, imageSrc]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // La cámara frontal se muestra espejada; corregimos al capturar
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    console.info('[GreenNode] [Camera] Foto capturada');
    stopCamera();
    setImageSrc(dataUrl);
    setFileName('captura.jpg');
    setResult(null);
    setStatus('idle');
  };

  // --- Adjuntar archivo ---
  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      console.warn('[GreenNode] Archivo ignorado: no es una imagen');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setFileName(file.name);
      setResult(null);
      setStatus('idle');
      console.info(`[GreenNode] Imagen adjuntada: ${file.name} (${Math.round(file.size / 1024)} KB)`);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  // --- Clasificación ---
  const handleClassify = async () => {
    if (!imageSrc) return;
    setStatus('classifying');
    setResult(null);

    let r: ClassificationResult;
    let usedReal = false;

    // Intenta el modelo real (TFJS) si está disponible; si no, simula.
    if (realModel) {
      try {
        r = await classifyWithModel(imageSrc);
        usedReal = true;
      } catch (err) {
        console.warn('[GreenNode] [TFJS] Falló el modelo real, usando simulación:', err);
        r = await classifyWasteSimulated();
      }
    } else {
      console.info('[GreenNode] [TFLite] (simulación) Preprocesando imagen 224x224...');
      r = await classifyWasteSimulated();
    }

    setLastWasReal(usedReal);
    setResult(r);
    setStatus('done');
    addClassification(r);
    iotSimulator.publishClassification(r.wasteType, r.confidence);
  };

  const reset = () => {
    setStatus('idle');
    setResult(null);
    setImageSrc(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    reset();
    setCameraError(null);
    setMode(m);
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <h2>📷 Escanear residuo</h2>
        <p className="screen-subtitle">
          Escanea con la cámara o adjunta una imagen · IA (MobileNetV2)
          {realModel === true && <span className="model-tag real"> · modelo real</span>}
          {realModel === false && <span className="model-tag sim"> · simulación</span>}
        </p>
      </header>

      {/* Selector de modo */}
      {status !== 'done' && (
        <div className="mode-switch">
          <button
            className={`mode-btn ${mode === 'camera' ? 'active' : ''}`}
            onClick={() => switchMode('camera')}
          >
            📸 Escáner
          </button>
          <button
            className={`mode-btn ${mode === 'upload' ? 'active' : ''}`}
            onClick={() => switchMode('upload')}
          >
            🖼️ Adjuntar
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      <div className="scan-area">
        {status === 'done' && result ? (
          <ClassificationCard
            result={result}
            imageSrc={imageSrc}
            usedRealModel={lastWasReal}
            onFeedback={(fb, auto, corrected) =>
              setClassificationFeedback(result.id, fb, auto, corrected)
            }
          />
        ) : imageSrc ? (
          <div className="preview-frame">
            <img src={imageSrc} alt={fileName ?? 'preview'} className="preview-img" />
            {status === 'classifying' && (
              <div className="preview-overlay">
                <div className="spinner-dark" />
                <p>Analizando imagen...</p>
              </div>
            )}
            {fileName && status === 'idle' && <span className="preview-name">{fileName}</span>}
          </div>
        ) : mode === 'camera' ? (
          <div className="camera-live">
            <video
              ref={videoRef}
              className={`camera-video ${facingMode === 'user' ? 'mirrored' : ''}`}
              playsInline
              muted
            />
            {cameraOn && <div className="scan-reticle" />}
            {cameraOn && hasMultipleCameras && (
              <button
                className="flip-camera-btn"
                onClick={flipCamera}
                title="Cambiar cámara"
              >
                🔄
              </button>
            )}
            {!cameraOn && (
              <div className="camera-off">
                {cameraError ? (
                  <>
                    <span className="camera-icon">🚫</span>
                    <p className="camera-error">{cameraError}</p>
                    <button className="btn btn-outline retry-btn" onClick={() => startCamera()}>
                      Reintentar
                    </button>
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
        ) : (
          <div
            className={`dropzone ${dragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <span className="camera-icon">🖼️</span>
            <p className="dropzone-title">Arrastra una imagen aquí</p>
            <p className="dropzone-hint">o haz clic para seleccionar un archivo</p>
          </div>
        )}
      </div>

      <div className="scan-actions">
        {status === 'done' ? (
          <button className="btn btn-outline btn-large" onClick={reset}>
            Escanear otro
          </button>
        ) : imageSrc ? (
          <>
            <button
              className="btn btn-primary btn-large"
              onClick={handleClassify}
              disabled={status === 'classifying'}
            >
              {status === 'classifying' ? 'Clasificando...' : '🔍 Clasificar'}
            </button>
            {status === 'idle' && (
              <button className="btn btn-secondary btn-large change-btn" onClick={reset}>
                {mode === 'camera' ? 'Volver a la cámara' : 'Cambiar imagen'}
              </button>
            )}
          </>
        ) : mode === 'camera' ? (
          <button
            className="btn btn-primary btn-large"
            onClick={capturePhoto}
            disabled={!cameraOn}
          >
            📸 Capturar
          </button>
        ) : (
          <button
            className="btn btn-primary btn-large"
            onClick={() => fileInputRef.current?.click()}
          >
            📎 Adjuntar imagen
          </button>
        )}
      </div>
    </div>
  );
}

const AUTO_CONFIRM_SECONDS = 20;

function ClassificationCard({
  result,
  imageSrc,
  usedRealModel,
  onFeedback,
}: {
  result: ClassificationResult;
  imageSrc: string | null;
  usedRealModel: boolean;
  onFeedback: (
    feedback: 'correct' | 'incorrect',
    autoConfirmed: boolean,
    correctedType?: WasteType | null,
  ) => void;
}) {
  const color = WASTE_TYPE_COLORS[result.wasteType];

  // Validación del usuario. Fases: 'ask' → 'choose' (elegir tipo real) → 'done'
  const [phase, setPhase] = useState<'ask' | 'choose' | 'done'>('ask');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [correctedType, setCorrectedType] = useState<WasteType | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CONFIRM_SECONDS);

  useEffect(() => {
    // El temporizador solo corre en la fase de pregunta inicial
    if (phase !== 'ask') return;
    if (secondsLeft <= 0) {
      // Timeout: se asume clasificación efectiva (correcta)
      setFeedback('correct');
      setPhase('done');
      onFeedback('correct', true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  const confirmCorrect = () => {
    setFeedback('correct');
    setPhase('done');
    onFeedback('correct', false);
  };

  const markIncorrect = () => {
    // Pasa a la fase de elegir el tipo real (detiene el temporizador)
    setFeedback('incorrect');
    setPhase('choose');
  };

  const selectCorrectType = (wt: WasteType) => {
    setCorrectedType(wt);
    setPhase('done');
    onFeedback('incorrect', false, wt);
  };

  const progressPct = (secondsLeft / AUTO_CONFIRM_SECONDS) * 100;

  return (
    <div className="result-card" style={{ borderColor: color }}>
      {imageSrc && <img src={imageSrc} alt="clasificada" className="result-thumb" />}
      <div className="result-icon" style={{ background: color + '22' }}>
        {WASTE_TYPE_ICONS[result.wasteType]}
      </div>
      <h3 style={{ color }}>{WASTE_TYPE_LABELS[result.wasteType]}</h3>
      <div className="confidence-bar-wrap">
        <div className="confidence-bar" style={{ width: `${result.confidence * 100}%`, background: color }} />
      </div>
      <p className="confidence-text">
        Confianza: <strong>{(result.confidence * 100).toFixed(1)}%</strong>
        {result.isLowConfidence && <span className="low-conf"> · baja confianza</span>}
      </p>
      <p className="disposal-tip">💡 {WASTE_DISPOSAL_TIP[result.wasteType]}</p>

      {/* --- Validación del usuario --- */}
      <div className="feedback-box">
        {phase === 'ask' && (
          <>
            <p className="feedback-question">¿La clasificación es correcta?</p>
            <div className="feedback-actions">
              <button className="btn feedback-yes" onClick={confirmCorrect}>
                ✓ Sí, correcta
              </button>
              <button className="btn feedback-no" onClick={markIncorrect}>
                ✗ No, incorrecta
              </button>
            </div>
            <div className="countdown-track">
              <div className="countdown-bar" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="countdown-text">
              Se confirmará como efectiva en {secondsLeft}s si no respondes
            </p>
          </>
        )}

        {phase === 'choose' && (
          <>
            <p className="feedback-question">¿Cuál era el tipo correcto?</p>
            <div className="correct-type-grid">
              {Object.values(WasteType)
                .filter((wt) => wt !== result.wasteType)
                .map((wt) => (
                  <button
                    key={wt}
                    className="correct-type-btn"
                    style={{ borderColor: WASTE_TYPE_COLORS[wt] }}
                    onClick={() => selectCorrectType(wt)}
                  >
                    <span className="ct-icon">{WASTE_TYPE_ICONS[wt]}</span>
                    <span className="ct-label">{WASTE_TYPE_LABELS[wt]}</span>
                  </button>
                ))}
            </div>
          </>
        )}

        {phase === 'done' && (
          <div className={`feedback-result ${feedback}`}>
            {feedback === 'correct' ? (
              <>
                ✓ Marcada como correcta
                {result.autoConfirmed && <span className="auto-tag"> (automático)</span>}
              </>
            ) : (
              <>
                ✗ Incorrecta · tipo real:{' '}
                {correctedType ? (
                  <strong style={{ color: WASTE_TYPE_COLORS[correctedType] }}>
                    {WASTE_TYPE_ICONS[correctedType]} {WASTE_TYPE_LABELS[correctedType]}
                  </strong>
                ) : (
                  'no especificado'
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="prob-list">
        {result.probabilities.map((p, i) => {
          const wt = Object.values(WasteType)[i];
          return (
            <div className="prob-row" key={wt}>
              <span className="prob-label">
                {WASTE_TYPE_ICONS[wt]} {WASTE_TYPE_LABELS[wt]}
              </span>
              <div className="prob-track">
                <div
                  className="prob-fill"
                  style={{ width: `${p * 100}%`, background: WASTE_TYPE_COLORS[wt] }}
                />
              </div>
              <span className="prob-val">{(p * 100).toFixed(0)}%</span>
            </div>
          );
        })}
      </div>

      <p className="inference-meta">
        ⚡ Inferencia en {result.inferenceTimeMs} ms ·{' '}
        {usedRealModel ? 'modelo real (TFJS)' : 'simulación'} · publicado vía MQTT
      </p>
    </div>
  );
}
