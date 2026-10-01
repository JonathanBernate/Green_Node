/**
 * DATOS DE EJEMPLO — ubicaciones ilustrativas en Bogotá. No corresponden a puntos
 * de acopio verificados; reemplazar por el endpoint del backend cuando exista.
 */
export type PointKind = 'acopio' | 'compostaje';

export interface CollectionPoint {
  id: string;
  name: string;
  kind: PointKind;
  address: string;
  latitude: number;
  longitude: number;
  accepts: string[];
  schedule: string;
}

export const COLLECTION_POINTS: CollectionPoint[] = [
  { id: 'cp-01', name: 'Punto Verde Centro', kind: 'acopio', address: 'Calle 19 # 4-20, Centro', latitude: 4.6043, longitude: -74.0695, accepts: ['Plástico', 'Papel', 'Vidrio', 'Metal'], schedule: 'Lun–Sáb 8:00–17:00' },
  { id: 'cp-02', name: 'Ecopunto Chapinero', kind: 'acopio', address: 'Carrera 13 # 53-40, Chapinero', latitude: 4.6402, longitude: -74.0639, accepts: ['Plástico', 'Papel', 'Cartón', 'Electrónicos'], schedule: 'Lun–Vie 9:00–18:00' },
  { id: 'cp-03', name: 'Centro de Acopio Teusaquillo', kind: 'acopio', address: 'Calle 34 # 17-12, Teusaquillo', latitude: 4.6240, longitude: -74.0780, accepts: ['Vidrio', 'Metal', 'Aceite usado'], schedule: 'Mar–Sáb 8:00–16:00' },
  { id: 'cp-04', name: 'Punto Limpio Usaquén', kind: 'acopio', address: 'Carrera 7 # 119-14, Usaquén', latitude: 4.6980, longitude: -74.0310, accepts: ['Plástico', 'Papel', 'Cartón', 'Pilas'], schedule: 'Lun–Sáb 7:00–15:00' },
  { id: 'cp-05', name: 'Planta de compostaje Jardín', kind: 'compostaje', address: 'Av. Calle 63 # 68-95, Engativá', latitude: 4.6690, longitude: -74.1010, accepts: ['Restos de comida', 'Poda', 'Hojas secas'], schedule: 'Lun–Vie 8:00–16:00' },
  { id: 'cp-06', name: 'Compostera Comunitaria Kennedy', kind: 'compostaje', address: 'Carrera 78 # 38 Sur, Kennedy', latitude: 4.6190, longitude: -74.1450, accepts: ['Restos de comida', 'Cáscaras', 'Café'], schedule: 'Sáb–Dom 8:00–13:00' },
  { id: 'cp-07', name: 'Huerta y Compost La Candelaria', kind: 'compostaje', address: 'Calle 12 # 2-35, La Candelaria', latitude: 4.5970, longitude: -74.0750, accepts: ['Restos de comida', 'Poda'], schedule: 'Mié–Dom 9:00–15:00' },
];
