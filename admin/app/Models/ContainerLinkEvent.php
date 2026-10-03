<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContainerLinkEvent extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'received_at' => 'datetime',
            'device_at' => 'datetime',
            'accepted' => 'boolean',
            'accuracy_m' => 'float',
        ];
    }
}
