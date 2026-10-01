export interface NavItem {
  to: string;
  label: string;
  icon: string;
  group: string;
  /** Aparece en la barra inferior del móvil. El resto va en "Más". */
  primary?: boolean;
  desc?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: 'home', group: 'Principal', primary: true, desc: 'Resumen del sistema' },
  { to: '/classification', label: 'Escanear', icon: 'scan', group: 'Principal', primary: true, desc: 'Clasifica un residuo con IA' },
  { to: '/containers', label: 'Contenedores', icon: 'list', group: 'Principal', primary: true, desc: 'Estado y nivel de llenado' },
  { to: '/map', label: 'Mapa', icon: 'map', group: 'Principal', primary: true, desc: 'Contenedores y gateways' },
  { to: '/collection-points', label: 'Acopio y compostaje', icon: 'recycle', group: 'Comunidad', desc: 'Puntos de acopio en Colombia' },
  { to: '/learn', label: 'Aprender', icon: 'book', group: 'Comunidad', desc: 'Micro-lecciones' },
  { to: '/history', label: 'Historial', icon: 'history', group: 'Comunidad', desc: 'Tus clasificaciones' },
  { to: '/network', label: 'Red', icon: 'signal', group: 'Sistema', desc: 'Métricas de la red IoT' },
  { to: '/reports', label: 'Reportes', icon: 'flag', group: 'Sistema', desc: 'Reporta una incidencia' },
  { to: '/settings', label: 'Ajustes', icon: 'settings', group: 'Sistema', desc: 'Cuenta y estado del sistema' },
];

export const NAV_GROUPS = ['Principal', 'Comunidad', 'Sistema'];
