<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContainerClassification extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'confidence' => 'float',
            'simulated' => 'boolean',
            'classified_at' => 'datetime',
        ];
    }

    public function container(): BelongsTo
    {
        return $this->belongsTo(Container::class);
    }
}
