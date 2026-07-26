<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Container extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'identifier',
        'address',
        'latitude',
        'longitude',
        'waste_type',
        'capacity_kg',
        'current_level_kg',
        'status',
        'last_collected_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'capacity_kg' => 'integer',
        'current_level_kg' => 'integer',
        'last_collected_at' => 'datetime',
    ];

    public function classifications()
    {
        return $this->hasMany(Classification::class);
    }

    public function deposits()
    {
        return $this->hasMany(Deposit::class);
    }

    public function getFillLevelPercentAttribute(): float
    {
        return $this->capacity_kg > 0
            ? round(($this->current_level_kg / $this->capacity_kg) * 100, 1)
            : 0;
    }

    public function getFillLevelCategoryAttribute(): string
    {
        $pct = $this->fill_level_percent;
        return match(true) {
            $pct >= 90 => 'critical',
            $pct >= 70 => 'high',
            $pct >= 40 => 'medium',
            default => 'low',
        };
    }
}
