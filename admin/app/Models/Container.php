<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Container extends Model
{
    use SoftDeletes;

    /** Segundos sin reportar a partir de los cuales la ubicación se considera desactualizada. */
    public const ONLINE_WITHIN_SECONDS = 120;

    /** Cada cuánto debe reportar un contenedor (el frontend usa el mismo valor). */
    public const REPORT_INTERVAL_SECONDS = 15;

    /** Los eventos de conexión se conservan este tiempo. */
    public const LINK_RETENTION_MINUTES = 60;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'last_latitude' => 'float',
            'last_longitude' => 'float',
            'last_accuracy_m' => 'float',
            'last_located_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    /**
     * Crea un contenedor asignado a un usuario con el siguiente identificador libre (CONT-001, CONT-002…).
     * `latitude/longitude` son la posición de instalación, que aún no se conoce: la ubicación real llega por el webhook.
     * `waste_type` es obligatorio en la tabla; un contenedor inteligente acepta todo, así que se deja el valor por defecto.
     * Debe llamarse dentro de una transacción.
     */
    public static function provisionFor(User $user, string $name, string $address, string $wasteType = 'organic'): self
    {
        $max = static::withTrashed()->lockForUpdate()->pluck('identifier')
            ->map(fn ($id) => (int) preg_replace('/\D/', '', (string) $id))->max() ?? 0;

        return static::create([
            'identifier' => sprintf('CONT-%03d', $max + 1),
            'name' => $name,
            'address' => $address,
            'latitude' => 0,
            'longitude' => 0,
            'waste_type' => $wasteType,
            'capacity_kg' => 100,
            'user_id' => $user->id,
        ]);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function classifications(): HasMany
    {
        return $this->hasMany(ContainerClassification::class);
    }

    public function linkEvents(): HasMany
    {
        return $this->hasMany(ContainerLinkEvent::class);
    }

    public function hasLocation(): bool
    {
        return $this->last_latitude !== null && $this->last_longitude !== null;
    }

    /** online | stale | none — calculado con el reloj del servidor. */
    public function locationStatus(): string
    {
        if (! $this->hasLocation() || ! $this->last_seen_at) {
            return 'none';
        }

        return $this->last_seen_at->diffInSeconds(now(), true) <= self::ONLINE_WITHIN_SECONDS ? 'online' : 'stale';
    }
}
