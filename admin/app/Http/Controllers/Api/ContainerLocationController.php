<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Container;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContainerLocationController extends Controller
{
    /** Webhook: el contenedor autenticado reporta su ubicación actual. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'container_id' => 'required|string|max:40',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'timestamp' => 'required|date|before_or_equal:+5 minutes',
            'accuracy' => 'nullable|numeric|min:0|max:100000',
        ]);

        // La identidad sale del token (Sanctum), nunca del cuerpo de la petición.
        $container = $request->user()->container;
        if (! $container) {
            abort(403, 'Este usuario no tiene un contenedor asignado.');
        }
        if ($data['container_id'] !== $container->identifier) {
            abort(403, 'No puedes actualizar la ubicación de otro contenedor.');
        }

        $locatedAt = \Illuminate\Support\Carbon::parse($data['timestamp']);

        // Lecturas fuera de orden (más antiguas que la ya registrada) no pisan la última ubicación.
        if ($container->last_located_at && $locatedAt->lessThanOrEqualTo($container->last_located_at)) {
            return response()->json(['updated' => false, 'location' => $this->present($container)]);
        }

        $container->update([
            'last_latitude' => $data['latitude'],
            'last_longitude' => $data['longitude'],
            'last_accuracy_m' => $data['accuracy'] ?? null,
            'last_located_at' => $locatedAt,
            'last_seen_at' => now(),
        ]);

        return response()->json(['updated' => true, 'location' => $this->present($container->refresh())]);
    }

    /** Todos los contenedores registrados con su última ubicación (incluye los que nunca reportaron). */
    public function index(): JsonResponse
    {
        $containers = Container::query()->withCount('classifications')->orderBy('identifier')->get();

        return response()->json([
            'server_time' => now()->toIso8601String(),
            'online_within_seconds' => Container::ONLINE_WITHIN_SECONDS,
            'data' => $containers->map(fn (Container $c) => $this->present($c))->values(),
        ]);
    }

    public function show(Container $container): JsonResponse
    {
        $container->loadCount('classifications');

        return response()->json($this->present($container));
    }

    private function present(Container $c): array
    {
        return [
            'container_id' => $c->identifier,
            'name' => $c->name ?: $c->identifier,
            'address' => $c->address,
            'status' => $c->locationStatus(),
            'latitude' => $c->last_latitude,
            'longitude' => $c->last_longitude,
            'accuracy' => $c->last_accuracy_m,
            'located_at' => $c->last_located_at?->toIso8601String(),
            'last_seen_at' => $c->last_seen_at?->toIso8601String(),
            'age_seconds' => $c->last_seen_at ? (int) $c->last_seen_at->diffInSeconds(now(), true) : null,
            'classifications_count' => $c->classifications_count ?? $c->classifications()->count(),
        ];
    }
}
