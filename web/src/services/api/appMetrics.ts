/**
 * Métricas de la APLICACIÓN medidas en este navegador (REAL):
 * tiempos de respuesta de la API y tiempos de inferencia.
 * NO son la latencia de la red IoT (esa viene del simulador/backend).
 */
export interface Sample {
  name: string;
  ms: number;
  ok: boolean;
  at: string;
}

type Listener = () => void;

class AppMetrics {
  private samples: Sample[] = [];
  private listeners = new Set<Listener>();

  record(name: string, ms: number, ok = true) {
    this.samples = [...this.samples, { name, ms, ok, at: new Date().toISOString() }].slice(-200);
    this.listeners.forEach((l) => l());
  }

  all(): Sample[] {
    return this.samples;
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  summary(prefix?: string) {
    const s = prefix ? this.samples.filter((x) => x.name.startsWith(prefix)) : this.samples;
    const okMs = s.filter((x) => x.ok).map((x) => x.ms).sort((a, b) => a - b);
    return {
      count: s.length,
      errors: s.filter((x) => !x.ok).length,
      avgMs: okMs.length ? okMs.reduce((a, b) => a + b, 0) / okMs.length : null,
      p95Ms: okMs.length ? okMs[Math.min(okMs.length - 1, Math.floor(okMs.length * 0.95))] : null,
    };
  }

  clear() {
    this.samples = [];
    this.listeners.forEach((l) => l());
  }
}

export const appMetrics = new AppMetrics();
