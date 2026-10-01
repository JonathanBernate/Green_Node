import { create } from 'zustand';
import type { ClassificationResult } from '@/domain/entities/WasteClassification';
import { WasteType } from '@/domain/entities/WasteClassification';
import { ClassifyWasteUseCase } from '@/domain/usecases/classification/ClassifyWasteUseCase';
import { tensorFlowService } from '@/infrastructure/ai/TensorFlowService';
import { modelManager, ModelStatus } from '@/infrastructure/ai/ModelManager';
import { MIN_CONFIDENCE_THRESHOLD } from '@/infrastructure/ai/ClassificationLabels';
import { useAuthStore } from './authStore';

interface ClassificationState {
  // Estado del modelo
  modelStatus: ModelStatus;

  // Estado de clasificación actual
  currentResult: ClassificationResult | null;
  isClassifying: boolean;
  error: string | null;
  isLowConfidence: boolean;

  // Historial local (últimas clasificaciones)
  history: ClassificationResult[];

  // Acciones
  initializeModel: () => Promise<void>;
  classifyImage: (imageUri: string, location?: { latitude: number; longitude: number }) => Promise<ClassificationResult>;
  correctClassification: (id: string, correctType: WasteType) => void;
  clearCurrent: () => void;
  clearError: () => void;
}

// Instancia del caso de uso
const classifyWasteUseCase = new ClassifyWasteUseCase(
  tensorFlowService,
  MIN_CONFIDENCE_THRESHOLD,
);

export const useClassificationStore = create<ClassificationState>()((set, get) => ({
  modelStatus: ModelStatus.NOT_LOADED,
  currentResult: null,
  isClassifying: false,
  error: null,
  isLowConfidence: false,
  history: [],

  initializeModel: async () => {
    try {
      set({ modelStatus: ModelStatus.LOADING });
      await modelManager.initialize();
      set({ modelStatus: ModelStatus.READY });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar el modelo';
      set({ modelStatus: ModelStatus.ERROR, error: message });
    }
  },

  classifyImage: async (imageUri, location) => {
    const userId = useAuthStore.getState().user?.id ?? 'anonymous';

    set({ isClassifying: true, error: null, isLowConfidence: false });

    try {
      const { result, isLowConfidence } = await classifyWasteUseCase.execute({
        imageUri,
        userId,
        location,
      });

      set((state) => ({
        currentResult: result,
        isClassifying: false,
        isLowConfidence,
        history: [result, ...state.history].slice(0, 50), // Max 50 en historial local
      }));

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al clasificar';
      set({ isClassifying: false, error: message });
      throw err;
    }
  },

  correctClassification: (id, correctType) => {
    set((state) => {
      const updated = state.history.map((item) =>
        item.id === id ? { ...item, wasteType: correctType } : item,
      );
      const current =
        state.currentResult?.id === id
          ? { ...state.currentResult, wasteType: correctType }
          : state.currentResult;
      return { history: updated, currentResult: current };
    });
  },

  clearCurrent: () => set({ currentResult: null, isLowConfidence: false }),

  clearError: () => set({ error: null }),
}));
