<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Historial de clasificaciones del usuario autenticado (tabla `classifications`). */
class ClassificationController extends Controller
{
    private const WASTE_TYPES = ['organic', 'plastic', 'paper', 'glass', 'metal', 'special'];

    public function index(Request $request): JsonResponse
    {
        $rows = $request->user()->classifications()->latest()->latest('id')->limit(200)->get();

        return response()->json($rows->map(fn (Classification $c) => $this->present($c))->values());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'waste_type' => ['required', Rule::in(self::WASTE_TYPES)],
            'confidence' => 'required|numeric|between:0,1',
            'timestamp' => 'nullable|date|before_or_equal:+5 minutes',
        ]);

        $c = $request->user()->classifications()->create([
            'waste_type' => $data['waste_type'],
            'confidence' => $data['confidence'],
            'user_confirmed' => false,
            'source' => 'ai',
            'created_at' => $data['timestamp'] ?? now(),
        ]);

        return response()->json($this->present($c), 201);
    }

    /** El usuario valida la predicción; si era incorrecta indica el tipo real (queda como `manual`). */
    public function feedback(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'feedback' => ['required', Rule::in(['correct', 'incorrect'])],
            'corrected_type' => ['required_if:feedback,incorrect', 'nullable', Rule::in(self::WASTE_TYPES)],
        ]);

        // Solo las propias: un id ajeno responde 404.
        $c = $request->user()->classifications()->findOrFail($id);

        if ($data['feedback'] === 'correct') {
            $c->update(['user_confirmed' => true]);
        } else {
            $c->update(['user_confirmed' => true, 'waste_type' => $data['corrected_type'], 'source' => 'manual']);
        }

        return response()->json($this->present($c->refresh()));
    }

    /** Borra una clasificación propia. Un id ajeno responde 404. */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->classifications()->findOrFail($id)->delete();

        return response()->json(['deleted' => 1]);
    }

    /** Borra todo el historial del usuario autenticado. */
    public function clear(Request $request): JsonResponse
    {
        return response()->json(['deleted' => $request->user()->classifications()->delete()]);
    }

    private function present(Classification $c): array
    {
        return [
            'id' => $c->id,
            'waste_type' => $c->waste_type,
            'confidence' => (float) $c->confidence,
            'user_confirmed' => (bool) $c->user_confirmed,
            'source' => $c->source,
            'created_at' => $c->created_at?->toIso8601String(),
        ];
    }
}
