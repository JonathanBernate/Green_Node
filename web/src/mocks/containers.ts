/**
 * DATOS DE SIMULACIÓN — nodos virtuales. No son mediciones de contenedores físicos.
 * Se usan solo cuando VITE_USE_MOCK_DATA no es 'false'.
 */
import { Container, ContainerStatus, WasteType } from '../lib/domain';
import type { Gateway } from '../types';

// Contenedores iniciales simulados (nodos IoT virtuales de la red)
export function getInitialContainers(): Container[] {
  return [
    {
      id: 'c-001',
      address: 'Calle 45 # 12-30, Barrio Centro',
      latitude: 4.6018,
      longitude: -74.0721,
      fillLevel: 32,
      status: ContainerStatus.ACTIVE,
      wasteTypes: [WasteType.PLASTIC, WasteType.PAPER, WasteType.METAL],
      capacity: 240,
      lastUpdated: new Date().toISOString(),
      virtual: true,
      batteryLevel: 94,
      gatewayId: 'gw-01',
    },
    {
      id: 'c-002',
      address: 'Carrera 7 # 32-16, Barrio La Soledad',
      latitude: 4.6280,
      longitude: -74.0660,
      fillLevel: 68,
      status: ContainerStatus.ACTIVE,
      wasteTypes: [WasteType.ORGANIC, WasteType.GLASS],
      capacity: 360,
      lastUpdated: new Date().toISOString(),
      virtual: true,
      batteryLevel: 81,
      gatewayId: 'gw-01',
    },
    {
      id: 'c-003',
      address: 'Av. Caracas # 50-20, Chapinero',
      latitude: 4.6410,
      longitude: -74.0630,
      fillLevel: 91,
      status: ContainerStatus.FULL,
      wasteTypes: [WasteType.PLASTIC, WasteType.GLASS, WasteType.METAL],
      capacity: 240,
      lastUpdated: new Date().toISOString(),
      virtual: true,
      batteryLevel: 67,
      gatewayId: 'gw-02',
    },
    {
      id: 'c-004',
      address: 'Calle 100 # 15-40, Usaquén',
      latitude: 4.6860,
      longitude: -74.0480,
      fillLevel: 12,
      status: ContainerStatus.ACTIVE,
      wasteTypes: [WasteType.ORGANIC, WasteType.PAPER],
      capacity: 480,
      lastUpdated: new Date().toISOString(),
      virtual: true,
      batteryLevel: 88,
      gatewayId: 'gw-02',
    },
    {
      id: 'c-005',
      address: 'Cra 30 # 45-03, Teusaquillo',
      latitude: 4.6320,
      longitude: -74.0850,
      fillLevel: 54,
      status: ContainerStatus.MAINTENANCE,
      wasteTypes: [WasteType.SPECIAL],
      capacity: 120,
      lastUpdated: new Date().toISOString(),
      virtual: true,
      batteryLevel: 42,
      gatewayId: 'gw-03',
    },
  ];
}

export function getMockGateways(): Gateway[] {
  return [
    { id: 'gw-01', name: 'Gateway Centro', latitude: 4.6150, longitude: -74.0690, coverageRadiusM: 2500, nodeIds: ['c-001', 'c-002'] },
    { id: 'gw-02', name: 'Gateway Norte', latitude: 4.6650, longitude: -74.0550, coverageRadiusM: 2500, nodeIds: ['c-003', 'c-004'] },
    { id: 'gw-03', name: 'Gateway Occidente', latitude: 4.6320, longitude: -74.0850, coverageRadiusM: 2000, nodeIds: ['c-005'] },
  ];
}
