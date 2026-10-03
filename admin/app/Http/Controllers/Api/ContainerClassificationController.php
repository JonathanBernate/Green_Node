<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ContainerClassificationController extends Controller
{
    private const WASTE_TYPES = ['organic', 'plastic', 'paper', 'glass', 'metal', 'special'];

    /** Registra una clasificación hecha por el contenedor autenticado (queda asociada a él). */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'waste_type' => ['required', Rule::in(self::WASTE_TYPES)],
            'confidence' => 'required|numeric|between:0,1',
            'model' => 'nullable|string|max:120',
            'inference_time_ms' => 'nullable|integer|min:0',
            'simulated' => 'nullable|boolean',
            'timestamp' => 'nullable|date|before_or_equal:+5 minutes',
        ]);

        $container = $request->user()->container;
        if (! $container) {
            abort(403, 'Este usuario no tiene un contenedor asignado.');
        }

        $classification = $container->classifications()->create([
            'waste_type' => $data['waste_type'],
            'confidence' => $data['confidence'],
            'model' => $data['model'] ?? null,
            'inference_time_ms' => $data['inference_time_ms'] ?? null,
            'simulated' => $data['simulated'] ?? false,
            'classified_at' => $data['timestamp'] ?? now(),
        ]);

        return response()->json([
            'id' => $classification->id,
            'container_id' => $container->identifier,
            'waste_type' => $classification->waste_type,
        ], 201);
    }
}
