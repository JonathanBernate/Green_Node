# Guía de Contribución — GreenNode

## Convenciones de Código

### Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos componente | PascalCase | `ButtonPrimary.tsx` |
| Archivos servicio | PascalCase | `TensorFlowService.ts` |
| Archivos hook | camelCase + `use` | `useIoTConnection.ts` |
| Archivos utilidad | camelCase | `validate.ts` |
| Archivos tipo | `*.types.ts` | `navigation.types.ts` |
| Archivos test | `*.test.ts` | `mqttClient.test.ts` |
| Constantes | SCREAMING_SNAKE | `MIN_CONFIDENCE_THRESHOLD` |
| Interfaces repositorio | Prefijo `I` | `IAuthRepository` |
| Clases de error | Sufijo `Error` | `MqttConnectionError` |
| Stores Zustand | Sufijo `Store` | `useAuthStore` |

### Estilo de código

- TypeScript strict mode
- Funciones puras cuando sea posible
- Componentes funcionales (no class components)
- Hooks personalizados para lógica reutilizable
- Imports absolutos con alias `@/` → `src/`

### Estructura de un feature

```
src/presentation/features/{feature}/
├── screens/        # Pantallas (una por archivo)
├── components/     # Componentes específicos del feature
├── hooks/          # Hooks específicos del feature
└── index.ts        # Re-exportaciones
```

---

## Flujo de Git

### Branches

```
main ← develop ← feature/nombre-del-feature
```

### Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar pantalla de clasificación
fix: corregir reconexión MQTT en background
docs: actualizar documentación de arquitectura
refactor: extraer lógica de validación a utils
style: formatear con prettier
test: agregar tests para ClassifyWasteUseCase
```

### Pull Requests

1. Crear branch desde `develop`: `feature/mqtt-connection`
2. Implementar cambios
3. Verificar que compila sin errores
4. Crear PR hacia `develop`
5. Descripción con: qué se hizo, cómo probar, screenshots si aplica

---

## Agregar un Nuevo Feature

### 1. Crear entidad (si es nueva)

```typescript
// src/domain/entities/NuevoConcepto.ts
export interface NuevoConcepto {
  id: string;
  // ...propiedades
}
```

### 2. Crear interfaz de repositorio

```typescript
// src/domain/repositories/INuevoRepository.ts
export interface INuevoRepository {
  getAll(): Promise<NuevoConcepto[]>;
  // ...métodos
}
```

### 3. Crear caso de uso

```typescript
// src/domain/usecases/nuevo/NuevoUseCase.ts
export class NuevoUseCase {
  constructor(private readonly repo: INuevoRepository) {}
  async execute(): Promise<NuevoConcepto[]> { ... }
}
```

### 4. Implementar repositorio

```typescript
// src/data/repositories/NuevoRepositoryImpl.ts
export class NuevoRepositoryImpl implements INuevoRepository { ... }
```

### 5. Registrar en DI

```typescript
// src/data/di/container.ts
export const nuevoRepository = new NuevoRepositoryImpl();
export const nuevoUseCase = new NuevoUseCase(nuevoRepository);
```

### 6. Crear store

```typescript
// src/presentation/store/nuevoStore.ts
export const useNuevoStore = create<NuevoState>()((set) => ({ ... }));
```

### 7. Crear pantallas

```typescript
// src/presentation/features/nuevo/screens/NuevoScreen.tsx
```

---

## Testing

### Ejecutar tests

```bash
npm test
```

### Qué testear

| Capa | Nivel | Herramienta |
|------|-------|-------------|
| Domain (entities, use cases) | Unit | Jest |
| Data (repositories) | Integration | Jest + mocks |
| Presentation (screens) | Component | RNTL |
| Shared (utils) | Unit | Jest |

### Ejemplo de test

```typescript
// src/domain/usecases/auth/LoginUseCase.test.ts
describe('LoginUseCase', () => {
  it('should login successfully with valid credentials', async () => {
    const mockRepo = { login: jest.fn().mockResolvedValue(mockAuthResult) };
    const useCase = new LoginUseCase(mockRepo);
    const result = await useCase.execute('test@test.com', '123456');
    expect(result.user.email).toBe('test@test.com');
  });
});
```
