/**
 * Cliente WebSocket del clasificador en vivo (servicio Python en /realtime).
 * Envía un frame y espera la respuesta antes de enviar el siguiente, para que
 * la latencia nunca se acumule.
 */

export type WasteGroup = 'organico' | 'reciclable' | 'no_reciclable' | 'peligroso';

export interface LivePrediction {
  label: string;
  confidence: number;
  group: WasteGroup;
  waste_type: string | null;
  top3: { label: string; confidence: number; group: WasteGroup; waste_type?: string | null }[];
  inference_ms: number;
  model?: string;
}

export const GROUP_LABELS: Record<WasteGroup, string> = {
  organico: 'Orgánico',
  reciclable: 'Reciclable',
  no_reciclable: 'No reciclable',
  peligroso: 'Peligroso',
};

export const GROUP_COLORS: Record<WasteGroup, string> = {
  organico: '#4CAF50',
  reciclable: '#2196F3',
  no_reciclable: '#757575',
  peligroso: '#F44336',
};

export const GROUP_ICONS: Record<WasteGroup, string> = {
  organico: '🍃',
  reciclable: '♻️',
  no_reciclable: '🗑️',
  peligroso: '⚠️',
};

/** Etiquetas del modelo en español para mostrar el objeto detectado. */
export const LABEL_ES: Record<string, string> = {
  battery: 'Pila / batería',
  biological: 'Residuo biológico',
  'brown-glass': 'Vidrio marrón',
  'green-glass': 'Vidrio verde',
  'white-glass': 'Vidrio transparente',
  cardboard: 'Cartón',
  clothes: 'Ropa',
  metal: 'Metal',
  paper: 'Papel',
  plastic: 'Plástico',
  shoes: 'Calzado',
  trash: 'Basura general',
};

import { Bin, WASTE_TYPE_BIN, WasteType } from './domain';

/** Caneca (Resolución 2184/2019) para una predicción del servicio en vivo. */
export function binForLive(p: Pick<LivePrediction, 'group' | 'waste_type'>): Bin {
  if (p.waste_type && p.waste_type in WASTE_TYPE_BIN) return WASTE_TYPE_BIN[p.waste_type as WasteType];
  // Sin tipo equivalente (ropa, calzado, basura general): según el grupo
  if (p.group === 'organico') return 'verde';
  if (p.group === 'reciclable') return 'blanca';
  return 'negra';
}

/**
 * Suaviza el video: acumula las últimas N predicciones (top-3 ponderado por
 * confianza) y devuelve la etiqueta dominante solo si es consistente.
 */
export class LiveSmoother {
  private window: LivePrediction[] = [];

  constructor(
    private size = 5,
    private minShare = 0.45,
    private minFrames = 3,
  ) {}

  reset() {
    this.window = [];
  }

  push(p: LivePrediction): { label: string; confidence: number; prediction: LivePrediction } | null {
    this.window.push(p);
    if (this.window.length > this.size) this.window.shift();
    if (this.window.length < this.minFrames) return null;

    const score = new Map<string, number>();
    const latest = new Map<string, LivePrediction>();
    for (const frame of this.window) {
      for (const t of frame.top3.length ? frame.top3 : [frame]) {
        score.set(t.label, (score.get(t.label) ?? 0) + t.confidence);
      }
      latest.set(frame.label, frame);
    }
    const [label, total] = [...score.entries()].sort((a, b) => b[1] - a[1])[0];
    const confidence = total / this.window.length;
    const base = latest.get(label) ?? [...this.window].reverse().find((f) => f.top3.some((t) => t.label === label));
    if (!base || confidence < this.minShare) return null;
    const top = base.top3.find((t) => t.label === label);
    return { label, confidence, prediction: { ...base, label, group: top?.group ?? base.group, waste_type: top?.waste_type ?? base.waste_type } };
  }
}

function wsUrl(): string {
  const override = import.meta.env.VITE_LIVE_API_URL as string | undefined;
  if (override) return override.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws/predict';
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/live/ws/predict`;
}

export type LiveStatus = 'connecting' | 'open' | 'closed';

export class LiveClassifierClient {
  private ws: WebSocket | null = null;
  private busy = false;
  private stopped = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private onResult: (p: LivePrediction) => void,
    private onStatus: (s: LiveStatus) => void,
  ) {}

  connect() {
    this.stopped = false;
    this.onStatus('connecting');
    const ws = new WebSocket(wsUrl());
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    ws.onopen = () => this.onStatus('open');
    ws.onmessage = (ev) => {
      this.busy = false;
      try {
        const data = JSON.parse(ev.data);
        if (!data.error) this.onResult(data as LivePrediction);
      } catch {
        /* respuesta inválida: se ignora */
      }
    };
    ws.onclose = () => {
      this.busy = false;
      this.onStatus('closed');
      if (!this.stopped) this.retryTimer = setTimeout(() => this.connect(), 2000);
    };
    ws.onerror = () => ws.close();
  }

  /** Envía un frame si el anterior ya fue respondido. Devuelve true si se envió. */
  send(frame: Blob): boolean {
    if (this.busy || this.ws?.readyState !== WebSocket.OPEN) return false;
    this.busy = true;
    this.ws.send(frame);
    return true;
  }

  close() {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.ws?.close();
    this.ws = null;
  }
}
