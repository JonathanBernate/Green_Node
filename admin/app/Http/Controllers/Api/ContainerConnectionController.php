<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Container;
use App\Models\ContainerLinkEvent;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/** Detalle de conexión de cada contenedor, calculado con los reportes recibidos en el webhook. */
class ContainerConnectionController extends Controller
{
    private const WINDOW_SECONDS = 300;

    private const SERIES_POINTS = 20;

    public function index(Request $request): JsonResponse
    {
        $isAdmin = $request->user()->roleName() === User::ROLE_ADMIN;
        $now = now();
        $since = $now->copy()->subMinutes(Container::LINK_RETENTION_MINUTES);

        $containers = Container::query()->orderBy('identifier')->get();
        $events = ContainerLinkEvent::query()
            ->whereIn('container_id', $containers->pluck('id'))
            ->where('received_at', '>=', $since)
            ->orderBy('received_at')
            ->get()
            ->groupBy('container_id');

        return response()->json([
            'server_time' => $now->toIso8601String(),
            'expected_interval_seconds' => Container::REPORT_INTERVAL_SECONDS,
            'window_seconds' => self::WINDOW_SECONDS,
            'data' => $containers->map(fn (Container $c) => $this->present($c, $events->get($c->id, collect()), $isAdmin))->values(),
        ]);
    }

    private function present(Container $c, Collection $events, bool $isAdmin): array
    {
        $now = now();
        $window = $events->filter(fn ($e) => $e->received_at->diffInSeconds($now, true) <= self::WINDOW_SECONDS)->values();
        $accepted = $window->where('accepted', true)->values();
        $last = $events->last();

        // Entrega: reportes recibidos vs. esperados desde el primero de la ventana.
        $delivery = null;
        if ($window->count() >= 2) {
            $span = $window->first()->received_at->diffInSeconds($now, true);
            $expected = max(1, (int) floor($span / Container::REPORT_INTERVAL_SECONDS) + 1);
            $delivery = (int) min(100, round($window->count() / $expected * 100));
        }

        $gaps = [];
        for ($i = 1; $i < $window->count(); $i++) {
            $gaps[] = $window[$i - 1]->received_at->diffInMilliseconds($window[$i]->received_at, true) / 1000;
        }
        $avgGap = $gaps ? array_sum($gaps) / count($gaps) : null;
        $jitter = ($gaps && count($gaps) > 1)
            ? sqrt(array_sum(array_map(fn ($g) => ($g - $avgGap) ** 2, $gaps)) / count($gaps))
            : null;

        $latencies = $window->pluck('latency_ms')->filter(fn ($v) => $v !== null)->values();
        $status = $c->locationStatus();

        return [
            'container_id' => $c->identifier,
            'name' => $c->name ?: $c->identifier,
            'status' => $status,
            'quality' => $this->quality($status, $delivery, $jitter),
            'last_seen_at' => $c->last_seen_at?->toIso8601String(),
            'age_seconds' => $c->last_seen_at ? (int) $c->last_seen_at->diffInSeconds($now, true) : null,
            'device_at' => $last?->device_at?->toIso8601String(),
            'reports_window' => $window->count(),
            'reports_ignored_window' => $window->count() - $accepted->count(),
            'reports_hour' => $events->count(),
            'delivery_pct' => $delivery,
            'avg_interval_s' => $avgGap !== null ? round($avgGap, 1) : null,
            'jitter_s' => $jitter !== null ? round($jitter, 1) : null,
            'latency_last_ms' => $last?->latency_ms,
            'latency_avg_ms' => $latencies->isNotEmpty() ? (int) round($latencies->avg()) : null,
            'accuracy_m' => $last?->accuracy_m,
            'latitude' => $c->last_latitude,
            'longitude' => $c->last_longitude,
            // IP y dispositivo solo para administradores.
            'ip' => $isAdmin ? $last?->ip : null,
            'user_agent' => $isAdmin ? $last?->user_agent : null,
            'series' => $events->slice(-self::SERIES_POINTS)->map(fn ($e) => [
                't' => $e->received_at->toIso8601String(),
                'latency_ms' => $e->latency_ms,
                'accepted' => $e->accepted,
            ])->values(),
        ];
    }

    private function quality(string $status, ?int $delivery, ?float $jitter): string
    {
        if ($status === 'none') {
            return 'none';
        }
        if ($status === 'stale') {
            return 'lost';
        }
        if ($delivery === null) {
            return 'good'; // recién conectado: aún no hay muestra suficiente
        }
        if ($delivery >= 90 && ($jitter ?? 0) <= 5) {
            return 'good';
        }

        return $delivery >= 60 ? 'fair' : 'poor';
    }
}
