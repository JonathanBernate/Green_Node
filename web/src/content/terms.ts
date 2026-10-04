export interface TermsSection {
  id: string;
  title: string;
  /** Párrafos; los que empiezan con "• " se muestran como lista. */
  body: string[];
}

export const TERMS_UPDATED = '3 de octubre de 2026';

/**
 * Texto base de los términos de GreenNode. Describe lo que la aplicación hace hoy.
 * Debe ser revisado por quien opere el servicio (asesoría legal) antes de publicarse en producción.
 */
export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'aceptacion',
    title: 'Aceptación de los términos',
    body: [
      'Al crear una cuenta, iniciar sesión o usar GreenNode aceptas estos Términos y condiciones. Si no estás de acuerdo con ellos, no uses la aplicación.',
      'Debes tener capacidad legal para aceptarlos. Si eres menor de edad, necesitas la autorización de tu madre, padre o representante legal.',
    ],
  },
  {
    id: 'servicio',
    title: 'Qué es GreenNode',
    body: [
      'GreenNode es una plataforma de gestión inteligente de residuos que te permite:',
      '• Clasificar residuos con ayuda de inteligencia artificial, mediante la cámara, una foto o una imagen de tu galería, y saber en qué caneca depositarlos (blanca, verde o negra).',
      '• Consultar un historial de tus clasificaciones.',
      '• Ver en un mapa el estado y la ubicación de los contenedores inteligentes registrados.',
      '• Aprender a separar residuos con micro-lecciones y reportar incidencias sobre un contenedor.',
    ],
  },
  {
    id: 'cuentas',
    title: 'Cuentas y tipos de usuario',
    body: [
      'Existen cuentas de Usuario, cuentas de Contenedor (que representan a un contenedor inteligente) y cuentas de Administrador. Las funciones disponibles dependen del tipo de cuenta.',
      'Debes dar información veraz y mantenerla actualizada. Eres responsable de la confidencialidad de tu contraseña y de lo que ocurra con tu cuenta; avísanos si sospechas un uso no autorizado y cierra tus sesiones desde Ajustes → Seguridad.',
      'Las cuentas de Administrador no se crean desde el registro público.',
    ],
  },
  {
    id: 'uso',
    title: 'Uso aceptable',
    body: [
      'Te comprometes a no:',
      '• Enviar reportes falsos, ofensivos o engañosos.',
      '• Suplantar a otra persona o a otro contenedor, ni registrar ubicaciones falsas.',
      '• Intentar acceder a datos de otras personas, vulnerar la seguridad del servicio o sobrecargarlo de forma intencional.',
      '• Subir imágenes que no te pertenezcan o que contengan contenido ilícito, personas o datos sensibles.',
    ],
  },
  {
    id: 'ia',
    title: 'Clasificación con inteligencia artificial',
    body: [
      'La clasificación es automática y orientativa: el modelo puede equivocarse, sobre todo con objetos poco comunes, sucios, rotos o en malas condiciones de luz. Cada resultado muestra su nivel de confianza.',
      'La regla de canecas se basa en el código de colores de la Resolución 2184 de 2019 (blanca: aprovechables; verde: orgánicos aprovechables; negra: no aprovechables). Las reglas de tu municipio pueden variar.',
      'Para residuos peligrosos o especiales (pilas, medicamentos, aceites, electrónicos) sigue las indicaciones de los puntos de recolección autorizados y no dependas solo de la aplicación.',
    ],
  },
  {
    id: 'datos',
    title: 'Datos personales y privacidad',
    body: [
      'Para funcionar, GreenNode trata estos datos: nombre, correo electrónico, contraseña (almacenada de forma cifrada), foto de perfil si decides subirla, historial de clasificaciones, reportes, progreso en lecciones y datos técnicos de tus sesiones (tipo de dispositivo y navegador).',
      'Las imágenes que analizas se envían al servicio de clasificación para obtener el resultado; en tu historial se guarda el tipo de residuo y la confianza, no la imagen.',
      'Usamos tus datos para prestar el servicio, mejorarlo y mantener su seguridad. No los vendemos.',
      'Conforme a la Ley 1581 de 2012 y normas que la complementan, tienes derecho a conocer, actualizar, rectificar y solicitar la supresión de tus datos, y a revocar tu autorización. Puedes editar tu nombre y foto en Ajustes y borrar tu historial desde la página Historial.',
    ],
  },
  {
    id: 'ubicacion',
    title: 'Ubicación y cuentas de Contenedor',
    body: [
      'Las cuentas de Contenedor envían periódicamente la ubicación del dispositivo, previa autorización en tu navegador. Esa ubicación, junto con el nombre, la dirección y el estado de conexión del contenedor, es visible para los usuarios y administradores autorizados en el mapa.',
      'Registra un contenedor solo si tienes derecho a operarlo. Puedes revocar el permiso de ubicación en cualquier momento desde tu navegador; el contenedor dejará de aparecer como activo.',
    ],
  },
  {
    id: 'propiedad',
    title: 'Propiedad intelectual',
    body: [
      'La aplicación, su diseño, marca, código y contenidos educativos pertenecen a sus titulares y están protegidos por la ley. Te damos una licencia limitada, personal y revocable para usarla conforme a estos términos.',
      'Conservas los derechos sobre las imágenes y textos que subas, y nos autorizas a tratarlos solo para prestarte el servicio.',
    ],
  },
  {
    id: 'responsabilidad',
    title: 'Disponibilidad y límite de responsabilidad',
    body: [
      'Hacemos lo posible por mantener el servicio disponible, pero puede haber interrupciones, errores o mantenimientos. El servicio se ofrece “tal cual”.',
      'En la medida permitida por la ley, no respondemos por decisiones tomadas únicamente con base en una clasificación automática ni por daños indirectos derivados del uso o de la imposibilidad de usar la aplicación.',
    ],
  },
  {
    id: 'terminacion',
    title: 'Suspensión y terminación',
    body: [
      'Puedes dejar de usar GreenNode cuando quieras. Podemos suspender o cerrar cuentas que incumplan estos términos, pongan en riesgo la seguridad o hagan un uso abusivo del servicio.',
    ],
  },
  {
    id: 'cambios',
    title: 'Cambios y ley aplicable',
    body: [
      'Podemos actualizar estos términos; la fecha de la última actualización aparece al inicio de esta página y, si el cambio es importante, te lo comunicaremos en la aplicación. Seguir usando el servicio después del cambio implica que lo aceptas.',
      'Estos términos se rigen por las leyes de la República de Colombia.',
    ],
  },
];
