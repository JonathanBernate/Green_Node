<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'container_id',
        'waste_type',
        'confidence',
        'image_path',
        'user_confirmed',
        'source',
    ];

    protected $casts = [
        'confidence' => 'decimal:4',
        'user_confirmed' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function container()
    {
        return $this->belongsTo(Container::class);
    }

    public function deposits()
    {
        return $this->hasMany(Deposit::class);
    }

    public function getWasteTypeLabelAttribute(): string
    {
        return match($this->waste_type) {
            'organic' => 'Organico',
            'plastic' => 'Plastico',
            'paper' => 'Papel',
            'glass' => 'Vidrio',
            'metal' => 'Metal',
            'special' => 'Residuo Especial',
        };
    }
}
