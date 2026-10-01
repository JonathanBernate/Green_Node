import { config } from '../../config/env';
import type { Classification, StoredEvent, WasteEvent } from '../../types';
import { logger } from '../../utils/logger';
import { request } from './apiClient';

const QUEUE_KEY = 'greennode.events';

function readQueue(): StoredEvent[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as StoredEvent[];
  } catch {
    return [];
  }
}
const writeQueue = (q: StoredEvent[]) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(0, 200)));

export function buildEvent(args: {
  userId: string;
  classification: string;
  confidence: number;
  model?: string;
  inferenceTimeMs?: number;
  location?: { lat: number; lng: number };
}): WasteEvent {
  return {
    event_type: 'waste_classification',
    event_id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id: args.userId,
    classification: args.classification,
    confidence: +args.confidence.toFixed(4),
    model: args.model,
    inference_time_ms: args.inferenceTimeMs,
    timestamp: new Date().toISOString(),
    location: args.location,
    source: config.useMockData ? 'SIMULATION' : 'REAL',
  };
}

export const classificationService = {
  /** POST /api/classification (multipart). Requiere el endpoint del backend. */
  async classifyImage(image: Blob): Promise<Classification> {
    const form = new FormData();
    form.append('image', image);
    const r = await request<{ class: string; confidence: number; model?: string; inference_time_ms?: number }>(
      '/api/classification',
      { method: 'POST', form, timeoutMs: 20000 },
    );
    return { class: r.class, confidence: r.confidence, model: r.model, inferenceTimeMs: r.inference_time_ms };
  },

  /**
   * Envía el evento al sistema. Si no hay backend o falla la red, queda en cola local
   * ('pending' o 'stored-local' en modo simulación) para reintento.
   */
  async sendEvent(event: WasteEvent): Promise<StoredEvent> {
    if (config.useMockData) {
      const stored: StoredEvent = { event, delivery: 'stored-local' };
      writeQueue([stored, ...readQueue()]);
      return stored;
    }
    try {
      await request('/api/events', { method: 'POST', body: event });
      const stored: StoredEvent = { event, delivery: 'sent' };
      writeQueue([stored, ...readQueue()]);
      return stored;
    } catch (err) {
      logger.warn('Evento en cola local por fallo de envío', err);
      const stored: StoredEvent = { event, delivery: 'pending' };
      writeQueue([stored, ...readQueue()]);
      return stored;
    }
  },

  queue(): StoredEvent[] {
    return readQueue();
  },

  /** Reintenta los eventos pendientes. */
  async flush(): Promise<number> {
    if (config.useMockData) return 0;
    const q = readQueue();
    let sent = 0;
    const next: StoredEvent[] = [];
    for (const item of q) {
      if (item.delivery !== 'pending') { next.push(item); continue; }
      try {
        await request('/api/events', { method: 'POST', body: item.event });
        next.push({ ...item, delivery: 'sent' });
        sent++;
      } catch {
        next.push(item);
      }
    }
    writeQueue(next);
    return sent;
  },
};
