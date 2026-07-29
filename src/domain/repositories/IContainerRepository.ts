import type { Container } from '../entities/Container';
import type { GeoPoint } from '../entities/GeoPoint';

export interface IContainerRepository {
  getNearby(location: GeoPoint, radiusMeters: number): Promise<Container[]>;
  getById(id: string): Promise<Container | null>;
  getAll(): Promise<Container[]>;
  subscribeFillLevel(containerId: string, callback: (level: number) => void): () => void;
  unsubscribeAll(): void;
}
