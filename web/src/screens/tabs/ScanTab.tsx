import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  classifyWasteSimulated,
  ClassificationResult,
  WASTE_TYPE_LABELS,
  WASTE_TYPE_COLORS,
  WASTE_TYPE_ICONS,
  WASTE_DISPOSAL_TIP,
  WASTE_TYPE_BIN,
  BIN_LABELS,
  BIN_COLORS,
  WasteType,
} from '../../lib/domain';
import { useAppStore } from '../../lib/appStore';
import { appMetrics, containerLocationService, isContainerUser } from '../../services/api';
import { useAuth } from '../../app/AuthProvider';
import { BinResult } from '../../components/waste/BinResult';
import { EventPanel } from '../../components/waste/EventPanel';
import { ModeTabs, ScanMode, modeFromSlug, slugFromMode } from '../../components/scan/ModeTabs';
import { RecentScans } from '../../components/scan/RecentScans';
import { Steps } from '../../components/scan/Steps';
import { ImageCropper } from '../../components/waste/ImageCropper';
import { cropImage } from '../../lib/cropImage';
import type { CropBox } from '../../lib/targetFrame';
import { TargetFrame } from '../../components/waste/TargetFrame';
import { targetCrop } from '../../lib/targetFrame';
import { classifyWithService, isServiceAvailable } from '../../lib/serviceClassifier';
import { LABEL_ES } from '../../lib/liveClassifier';
import { isModelAvailable, classifyWithModel, loadModel } from '../../lib/tfClassifier';
import { LiveScanner } from './LiveScanner';
import { Icon } from '../../components/Icon';

type Mode = ScanMode;
type Status = 'idle' | 'classifying' | 'done';

export function ScanTab() {
  const { addClassification, setClassificationFeedback } = useAppStore();
  const { user } = useAuth();
  // Rol 'contenedor': cada clasificación se registra en el backend asociada a su contenedor.
  const [containerSync, setContainerSync] = useState<'idle' | 'saved' | 'failed'>('idle');
  // El modo vive en la URL (?modo=vivo|foto|galeria): se puede compartir y el botón "atrás" funciona
  const [params, setParams] = useSearchParams();
  const mode: Mode = modeFromSlug(params.get('modo'));
  const setMode = (m: Mode) => setParams(m === 'live' ? {} : { modo: slugFromMode(m) }, { replace: true });
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);
  useEffect(() => { void isServiceAvailable().then(setAiOnline); }, []);
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Modo del modelo: null = aún no sabemos, true = real (TFJS), false = simulado
  const [realModel, setRealModel] = useState<boolean | null>(null);
  const [lastWasReal, setLastWasReal] = useState(false);
  // Galería: zona elegida por el usuario (null = imagen completa) y la imagen realmente analizada
  const [crop, setCrop] = useState<CropBox | null>(null);
  const [analyzedSrc, setAnalyzedSrc] = useState<string | null>(null);

  // Detecta al montar si hay un modelo real disponible en /model/
  // y lo precarga en segundo plano para que la primera clasificación sea rápida.
  useEffect(() => {
    isModelAvailable().then((available) => {
      setRealModel(available);
      if (available) {
        loadModel().catch((err) =>
          console.warn('[GreenNode] [TFLite] Precarga fallida:', err),
        );
      }
    });
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
    let msg = 'No se pudo acceder a la cámara. Revisa los permisos o usa la Galería.';
    if (name === 'NotAllowedError') msg = 'Permiso de cámara denegado. Actívalo en el navegador o usa la Galería.';
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
    // Solo se captura lo que está dentro del marco de enfoque
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const { sx, sy, side } = targetCrop(vw, vh, video.clientWidth, video.clientHeight);
    const out = Math.min(Math.round(side), 800);
    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // La cámara frontal se muestra espejada; corregimos al capturar
    if (facingMode === 'user') {
      ctx.translate(out, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, side, side, 0, 0, out, out);
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

    // Galería: se analiza solo la zona elegida
    let src = imageSrc;
    if (mode === 'upload' && crop) {
      try {
        src = await cropImage(imageSrc, crop);
      } catch (err) {
        console.warn('[GreenNode] No se pudo recortar, se usa la imagen completa:', err);
      }
    }
    setAnalyzedSrc(src);

    let r: ClassificationResult;
    let usedReal = false;

    // 1) Servicio de IA (mismo modelo que el modo en vivo)  2) modelo local TFLite  3) simulación
    let fromService: ClassificationResult | null = null;
    try {
      fromService = await classifyWithService(src, { tta: mode === 'upload' });
    } catch (err) {
      console.warn('[GreenNode] Servicio de IA no disponible, se usa el modelo local:', err);
    }

    if (fromService) {
      r = fromService;
      usedReal = true;
    } else if (realModel) {
      try {
        r = await classifyWithModel(src);
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
    // Lo que no equivale a uno de los 6 tipos (ropa, calzado, basura general) se muestra pero no se guarda
    if (!r.unmapped) addClassification(r);
    if (isContainerUser(user) && !r.unmapped) {
      setContainerSync('idle');
      containerLocationService
        .submitClassification({ wasteType: r.wasteType, confidence: r.confidence, model: r.model, inferenceTimeMs: r.inferenceTimeMs, simulated: r.simulated, timestamp: r.timestamp })
        .then(() => setContainerSync('saved'))
        .catch(() => setContainerSync('failed'));
    }
    if (!r.simulated) appMetrics.record('inference', r.inferenceTimeMs, true);
  };

  const reset = () => {
    setStatus('idle');
    setResult(null);
    setImageSrc(null);
    setFileName(null);
    setCrop(null);
    setAnalyzedSrc(null);
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
      <header className="screen-header scan-header">
        <div>
          <h2>Escanear residuo</h2>
          <p className="screen-subtitle">Apunta, fotografía o sube una imagen y te diremos en qué caneca va.</p>
        </div>
        <span className={`ai-chip ${aiOnline || realModel ? 'on' : aiOnline === false ? 'off' : ''}`} role="status" title={aiOnline ? 'Modelo del servicio de IA' : realModel ? 'Modelo local en el navegador' : undefined}>
          <i aria-hidden="true" />
          {aiOnline === null && realModel !== true ? 'Cargando modelo…' : aiOnline || realModel ? 'Modelo activo' : 'Sin modelo (simulación)'}
        </span>
      </header>

      {containerSync === 'saved' && <p className="inference-meta" role="status">Clasificación registrada en tu contenedor.</p>}
      {containerSync === 'failed' && <div className="alert-box" role="alert">No se pudo registrar la clasificación en el servidor.</div>}

      {status !== 'done' && <ModeTabs mode={mode} onChange={switchMode} />}

      {mode !== 'live' && (
        <Steps
          steps={mode === 'camera' ? ['Capturar', 'Confirmar', 'Resultado'] : ['Elegir imagen', 'Ajustar zona', 'Resultado']}
          current={status === 'done' ? 2 : imageSrc ? 1 : 0}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      <div id="scan-panel" role="tabpanel" aria-labelledby={`scan-tab-${mode}`}>
      {mode === 'live' && status !== 'done' && <LiveScanner />}

      <div className="scan-area" style={mode === 'live' ? { display: 'none' } : undefined}>
        {status === 'done' && result ? (
          <ClassificationCard
            result={result}
            imageSrc={analyzedSrc ?? imageSrc}
            usedRealModel={lastWasReal}
            onFeedback={(fb, auto, corrected) =>
              setClassificationFeedback(result.id, fb, auto, corrected)
            }
          />
        ) : imageSrc && mode === 'upload' && status === 'idle' ? (
          <ImageCropper src={imageSrc} alt={fileName ?? 'Imagen elegida'} onChange={setCrop} />
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
            {cameraOn && <TargetFrame />}
            {cameraOn && hasMultipleCameras && (
              <button
                className="flip-camera-btn"
                onClick={flipCamera}
                title="Cambiar cámara"
              >
                <Icon name="flip" size={20} />
              </button>
            )}
            {!cameraOn && (
              <div className="camera-off">
                {cameraError ? (
                  <>
                    <span className="camera-icon"><Icon name="camera" size={40} /></span>
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
            <span className="camera-icon"><Icon name="image" size={40} /></span>
            <p className="dropzone-title">Arrastra una imagen aquí</p>
            <p className="dropzone-hint">o haz clic para seleccionar un archivo</p>
          </div>
        )}
      </div>

      <div className="scan-actions" style={mode === 'live' ? { display: 'none' } : undefined}>
        {status === 'done' ? (
          <>
            <button className="btn btn-primary btn-large" onClick={reset}>
              <Icon name="scan" size={18} /> Escanear otro residuo
            </button>
            {!isContainerUser(user) && (
              <div className="done-links">
                <Link to="/history" className="done-link"><Icon name="history" size={16} /> Ver historial</Link>
                <Link to="/learn" className="done-link"><Icon name="book" size={16} /> Aprender a separar</Link>
              </div>
            )}
          </>
        ) : imageSrc ? (
          <>
            <button
              className="btn btn-primary btn-large"
              onClick={handleClassify}
              disabled={status === 'classifying'}
            >
              {status === 'classifying' ? 'Clasificando...' : 'Clasificar'}
            </button>
            {status === 'idle' && (
              <button className="btn btn-secondary btn-large change-btn" onClick={reset}>
                {mode === 'camera' ? 'Volver a la cámara' : 'Cambiar imagen'}
              </button>
            )}
          </>
        ) : mode === 'camera' ? (
          <button
            className="shutter-btn"
            onClick={capturePhoto}
            disabled={!cameraOn}
            aria-label="Capturar foto"
          >
            <span className="shutter-ring" />
          </button>
        ) : (
          <button
            className="btn btn-primary btn-large"
            onClick={() => fileInputRef.current?.click()}
          >
            Elegir imagen
          </button>
        )}
      </div>
      </div>

      {status !== 'done' && (
        <>
          <details className="scan-tips">
            <summary>Consejos para clasificar mejor</summary>
            <ul>
              <li>Coloca <b>un solo residuo</b> dentro del marco, centrado y cerca de la cámara.</li>
              <li>Usa <b>buena luz</b> y evita reflejos o sombras fuertes.</li>
              <li>Fondo liso (una mesa o una pared) ayuda más que un fondo con objetos.</li>
              <li>Si el resultado dice "baja confianza", toma otra foto desde otro ángulo.</li>
            </ul>
          </details>
          {!isContainerUser(user) && <RecentScans />}
        </>
      )}
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
  // 'unmapped': el modelo detectó algo sin equivalente entre los 6 tipos (ropa, calzado, basura general)
  const unmapped = !!result.unmapped;
  const bin = result.bin ?? WASTE_TYPE_BIN[result.wasteType];
  const color = unmapped ? BIN_COLORS[bin] : WASTE_TYPE_COLORS[result.wasteType];
  const detected = result.detectedLabel ? (LABEL_ES[result.detectedLabel] ?? result.detectedLabel) : null;
  const title = unmapped && detected ? detected : WASTE_TYPE_LABELS[result.wasteType];

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
    <div className="result-card rc" style={{ borderColor: color }}>
      <div className="rc-top">
        {imageSrc && <img src={imageSrc} alt="Imagen clasificada" className="rc-photo" style={{ borderColor: color }} />}
        <div className="rc-head">
          <span className="rc-kicker">Resultado</span>
          <h3 style={{ color }}>
            <span aria-hidden="true">{unmapped ? '🗑️' : WASTE_TYPE_ICONS[result.wasteType]}</span> {title}
          </h3>
          {!unmapped && detected && detected !== title && <p className="detected-as">Detectado: {detected}</p>}
          <div className="rc-conf" aria-label={`Confianza ${(result.confidence * 100).toFixed(0)}%`}>
            <div className="confidence-bar-wrap"><div className="confidence-bar" style={{ width: `${result.confidence * 100}%`, background: color }} /></div>
            <b>{(result.confidence * 100).toFixed(0)}%</b>
          </div>
          <span className="rc-conf-label">{result.isLowConfidence ? 'Confianza baja' : result.confidence >= 0.8 ? 'Confianza alta' : 'Confianza media'}</span>
        </div>
      </div>

      <BinResult bin={bin} uncertain={result.isLowConfidence} />
      {result.isLowConfidence && !result.simulated && (
        <p className="low-conf-tip" role="note">
          No estoy seguro de este resultado. Toma otra foto con buena luz, con el objeto centrado y sin otros residuos alrededor.
        </p>
      )}
      {result.simulated && (
        <div className="notice-sim" role="alert">
          <b>RESULTADO SIMULADO.</b> No hay modelo cargado: esta categoría es aleatoria y no es una predicción real.
        </div>
      )}
      <p className="disposal-tip">
        💡 {unmapped ? `${BIN_LABELS[bin]}: no es un residuo aprovechable. Si está limpio y en buen estado, considera donarlo.` : WASTE_DISPOSAL_TIP[result.wasteType]}
      </p>
      {unmapped && <p className="inference-meta">Este tipo de residuo no está entre los 6 que registra GreenNode, por eso no se guarda en tu historial.</p>}

      {/* --- Validación del usuario --- */}
      {!unmapped && <div className="feedback-box">
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
                    {WASTE_TYPE_ICONS[correctedType]} {WASTE_TYPE_LABELS[correctedType]} → {BIN_LABELS[WASTE_TYPE_BIN[correctedType]]}
                  </strong>
                ) : (
                  'no especificado'
                )}
              </>
            )}
          </div>
        )}
      </div>}

      <details className="rc-more">
        <summary>Ver detalles del análisis</summary>
      {!unmapped && <div className="prob-list">
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
      </div>}

      {!unmapped && <EventPanel
        classification={result.wasteType}
        confidence={result.confidence}
        model={result.model}
        inferenceTimeMs={result.inferenceTimeMs}
        disabledReason={result.simulated ? 'Los resultados simulados no se envían al sistema.' : undefined}
      />}

      <p className="inference-meta">
        Inferencia en {result.inferenceTimeMs} ms · {result.simulated ? 'simulación' : 'modelo real'}
      </p>
      </details>
    </div>
  );
}
