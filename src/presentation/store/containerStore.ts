import { create } from 'zustand';
import type { Container } from '@/domain/entities/Container';
import { ContainerStatus } from '@/domain/entities/Container';

interface ContainerState {
  containers: Container[];
  selectedContainerId: string | null;
  isLoading: boolean;
  lastUpdated: string | null;

  // Acciones
  setContainers: (containers: Container[]) => void;
  updateFillLevel: (containerId: string, fillLevel: number, timestamp: string) => void;
  updateStatus: (containerId: string, status: ContainerStatus) => void;
  selectContainer: (id: string | null) => void;
  getById: (id: string) => Container | undefined;
}

// Datos iniciales simulados de contenedores en Bogotá
const MOCK_CONTAINERS: Container[] = [
  {
    id: 'c-001',
    location: { latitude: 4.6280, longitude: -74.0650 },
    address: 'Cra 68 #25-30, Kennedy',
    fillLevel: 45,
    status: ContainerStatus.ACTIVE,
    wasteTypes: ['organic', 'plastic', 'paper'],
    lastUpdated: new Date().toISOString(),
    capacity: 240,
  },
  {
    id: 'c-002',
    location: { latitude: 4.6350, longitude: -74.0830 },
    address: 'Cl 38 Sur #72-10, Kennedy',
    fillLevel: 78,
    status: ContainerStatus.ACTIVE,
    wasteTypes: ['glass', 'metal'],
    lastUpdated: new Date().toISOString(),
    capacity: 120,
  },
  {
    id: 'c-003',
    location: { latitude: 4.7110, longitude: -74.0720 },
    address: 'Av Suba #115-40, Suba',
    fillLevel: 92,
    status: ContainerStatus.FULL,
    wasteTypes: ['organic', 'plastic', 'paper', 'glass', 'metal'],
    lastUpdated: new Date().toISOString(),
    capacity: 360,
  },
  {
    id: 'c-004',
    location: { latitude: 4.6590, longitude: -74.0560 },
    address: 'Cra 7 #45-12, Chapinero',
    fillLevel: 20,
    status: ContainerStatus.ACTIVE,
    wasteTypes: ['plastic', 'paper', 'glass'],
    lastUpdated: new Date().toISOString(),
    capacity: 240,
  },
  {
    id: 'c-005',
    location: { latitude: 4.5980, longitude: -74.0760 },
    address: 'Cl 57 Sur #68D-20, Bosa',
    fillLevel: 65,
    status: ContainerStatus.ACTIVE,
    wasteTypes: ['organic', 'special'],
    lastUpdated: new Date().toISOString(),
    capacity: 120,
  },
  {
    id: 'c-006',
    location: { latitude: 4.6800, longitude: -74.0470 },
    address: 'Av 19 #134-50, Usaquén',
    fillLevel: 10,
    status: ContainerStatus.ACTIVE,
    wasteTypes: ['plastic', 'paper', 'glass', 'metal'],
    lastUpdated: new Date().toISOString(),
    capacity: 240,
  },
  {
    id: 'c-007',
    location: { latitude: 4.6470, longitude: -74.1050 },
    address: 'Cl 63 #98-20, Engativá',
    fillLevel: 55,
    status: ContainerStatus.MAINTENANCE,
    wasteTypes: ['organic', 'plastic'],
    lastUpdated: new Date().toISOString(),
    capacity: 360,
  },
  {
    id: 'c-008',
    location: { latitude: 4.5730, longitude: -74.1280 },
    address: 'Av Villavicencio #45-90, Ciudad Bolívar',
    fillLevel: 87,
    status: ContainerStatus.ACTIVE,
    wasteTypes: ['organic', 'plastic', 'paper', 'glass', 'metal', 'special'],
    lastUpdated: new Date().toISOString(),
    capacity: 360,
  },
];

export const useContainerStore = create<ContainerState>()((set, get) => ({
  containers: MOCK_CONTAINERS,
  selectedContainerId: null,
  isLoading: false,
  lastUpdated: new Date().toISOString(),

  setContainers: (containers) => set({ containers, lastUpdated: new Date().toISOString() }),

  updateFillLevel: (containerId, fillLevel, timestamp) => {
    set((state) => ({
      containers: state.containers.map((c) =>
        c.id === containerId
          ? {
              ...c,
              fillLevel,
              lastUpdated: timestamp,
              status: fillLevel >= 90 ? ContainerStatus.FULL : c.status,
            }
          : c,
      ),
      lastUpdated: timestamp,
    }));
  },

  updateStatus: (containerId, status) => {
    set((state) => ({
      containers: state.containers.map((c) =>
        c.id === containerId ? { ...c, status } : c,
      ),
    }));
  },

  selectContainer: (id) => set({ selectedContainerId: id }),

  getById: (id) => get().containers.find((c) => c.id === id),
}));
