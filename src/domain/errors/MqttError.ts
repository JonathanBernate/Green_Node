import { AppError } from './AppError';

export class MqttError extends AppError {
  constructor(message: string, code: string, cause?: Error) {
    super(message, code, cause);
  }
}

export class MqttConnectionError extends MqttError {
  constructor(brokerUrl: string, cause?: Error) {
    super(
      `No se pudo conectar al broker MQTT: ${brokerUrl}`,
      'MQTT_CONNECTION_FAILED',
      cause,
    );
  }
}

export class MqttPublishError extends MqttError {
  constructor(topic: string, cause?: Error) {
    super(
      `Error al publicar en el topic: ${topic}`,
      'MQTT_PUBLISH_FAILED',
      cause,
    );
  }
}

export class MqttSubscribeError extends MqttError {
  constructor(topic: string, cause?: Error) {
    super(
      `Error al suscribirse al topic: ${topic}`,
      'MQTT_SUBSCRIBE_FAILED',
      cause,
    );
  }
}
