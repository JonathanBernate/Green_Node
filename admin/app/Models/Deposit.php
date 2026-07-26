<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Deposit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'classification_id',
        'container_id',
        'weight_kg',
        'points_earned',
        'classification_correct',
    ];

    protected $casts = [
        'weight_kg' => 'decimal:3',
        'points_earned' => 'integer',
        'classification_correct' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function classification()
    {
        return $this->belongsTo(Classification::class);
    }

    public function container()
    {
        return $this->belongsTo(Container::class);
    }
}
