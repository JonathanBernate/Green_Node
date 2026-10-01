export interface NavItem {
  to: string;
  label: string;
  icon: string;
  /** Aparece en la barra inferior del móvil. El resto va en "Más". */
  primary?: boolean;
  desc?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: 'home', primary: true, desc: 'Resumen del sistema' },
  { to: '/classification', label: 'Escanear', icon: 'scan', primary: true, desc: 'Clasifica un residuo con IA' },
  { to: '/containers', label: 'Contenedores', icon: 'list', primary: true, desc: 'Estado y nivel de llenado' },
  { to: '/map', label: 'Mapa', icon: 'map', primary: true, desc: 'Contenedores y gateways' },
  { to: '/collection-points', label: 'Puntos de acopio y compostaje', icon: 'recycle', desc: 'Mapa de puntos de acopio' },
  { to: '/network', label: 'Red', icon: 'signal', desc: 'Métricas de la red IoT' },
  { to: '/reports', label: 'Reportes', icon: 'flag', desc: 'Reporta una incidencia' },
  { to: '/history', label: 'Historial', icon: 'history', desc: 'Tus clasificaciones' },
  { to: '/learn', label: 'Aprender', icon: 'book', desc: 'Micro-lecciones' },
  { to: '/settings', label: 'Ajustes', icon: 'settings', desc: 'Cuenta y estado del sistema' },
];
