/**
 * Configuración de entorno.
 * TODO: Reemplazar con react-native-config cuando se integren .env files.
 */

export interface Environment {
  apiUrl: string;
  mqttBrokerUrl: string;
  mqttPort: number;
  wsUrl: string;
  mapApiKey: string;
  tfModelUrl: string;
  environment: 'development' | 'staging' | 'production';
}

const development: Environment = {
  apiUrl: 'http://localhost:3000/api',
  mqttBrokerUrl: 'mqtt://localhost',
  mqttPort: 1883,
  wsUrl: 'ws://localhost:3000',
  mapApiKey: '', // Agregar API key de Google Maps
  tfModelUrl: '',
  environment: 'development',
};

const staging: Environment = {
  apiUrl: 'https://staging-api.greennode.co/api',
  mqttBrokerUrl: 'mqtts://mqtt.greennode.co',
  mqttPort: 8883,
  wsUrl: 'wss://staging-api.greennode.co',
  mapApiKey: '',
  tfModelUrl: '',
  environment: 'staging',
};

const production: Environment = {
  apiUrl: 'https://api.greennode.co/api',
  mqttBrokerUrl: 'mqtts://mqtt.greennode.co',
  mqttPort: 8883,
  wsUrl: 'wss://api.greennode.co',
  mapApiKey: '',
  tfModelUrl: '',
  environment: 'production',
};

// Por defecto, usa development. Cambiar según el build.
export const ENV: Environment = __DEV__ ? development : production;

export { development, staging, production };
