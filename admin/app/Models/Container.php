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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function classifications(): HasMany
    {
        return $this->hasMany(ContainerClassification::class);
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
