import { ClassificationResult, WasteType } from '../../lib/domain';
import { request } from './apiClient';

interface ServerClassification {
  id: number;
  waste_type: WasteType;
  confidence: number;
  user_confirmed: boolean;
  source: 'ai' | 'manual';
  created_at: string;
}

/** Convierte una fila del servidor al modelo que usa la interfaz. */
export function fromServer(r: ServerClassification): ClassificationResult {
  const corrected = r.source === 'manual';
  return {
    id: `srv_${r.id}`,
    serverId: r.id,
    wasteType: r.waste_type,
    confidence: r.confidence,
    probabilities: [],
    isLowConfidence: r.confidence < 0.5,
    inferenceTimeMs: 0,
    timestamp: r.created_at,
    feedback: corrected ? 'incorrect' : r.user_confirmed ? 'correct' : null,
    autoConfirmed: false,
    correctedType: corrected ? r.waste_type : null,
  };
}

/** Historial personal de clasificaciones (Laravel, tabla `classifications`). */
export const historyService = {
  async list(): Promise<ClassificationResult[]> {
    return (await request<ServerClassification[]>('/api/classifications')).map(fromServer);
  },

  async save(r: ClassificationResult): Promise<number> {
    const saved = await request<ServerClassification>('/api/classifications', {
      method: 'POST',
      body: { waste_type: r.wasteType, confidence: +r.confidence.toFixed(4), timestamp: r.timestamp },
    });
    return saved.id;
  },

  async setFeedback(serverId: number, feedback: 'correct' | 'incorrect', correctedType: WasteType | null): Promise<void> {
    await request(`/api/classifications/${serverId}/feedback`, {
      method: 'PATCH',
      body: { feedback, corrected_type: correctedType },
    });
  },

  async remove(serverId: number): Promise<void> {
    await request(`/api/classifications/${serverId}`, { method: 'DELETE' });
  },

  async clear(): Promise<void> {
    await request('/api/classifications', { method: 'DELETE' });
  },
};
