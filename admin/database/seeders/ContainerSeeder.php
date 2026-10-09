<?php

namespace Database\Seeders;

use App\Models\Container;
use App\Models\User;
use Illuminate\Database\Seeder;

/** Contenedores registrados (idempotente). CONT-001 queda vinculada al usuario operador. */
class ContainerSeeder extends Seeder
{
    public function run(): void
    {
        $operator = User::where('email', 'contenedor@greennode.com')->first();

        // identifier, name, address, lat, lng, waste_type, capacity_kg, current_level_kg, status, vincular operador
        foreach ([
            ['CONT-001', 'Contenedor CONT-001', 'Calle Principal #123', 4.6097, -74.0817, 'organic', 100, 45, 'active', true],
            ['CONT-002', null, 'Av. Norte #456', 4.6100, -74.0820, 'plastic', 80, 65, 'active', false],
            ['CONT-003', null, 'Calle Sur #789', 4.6095, -74.0815, 'paper', 60, 20, 'active', false],
            ['CONT-004', null, 'Av. Este #101', 4.6098, -74.0810, 'glass', 90, 85, 'maintenance', false],
            ['CONT-005', null, 'Calle Oeste #202', 4.6102, -74.0825, 'metal', 70, 10, 'active', false],
        ] as [$identifier, $name, $address, $lat, $lng, $wasteType, $capacity, $level, $status, $linkOperator]) {
            $container = Container::updateOrCreate(['identifier' => $identifier], [
                'name' => $name ?: $identifier,
                'address' => $address,
                'latitude' => $lat,
                'longitude' => $lng,
                'waste_type' => $wasteType,
                'capacity_kg' => $capacity,
                'current_level_kg' => $level,
                'status' => $status,
            ]);

            if ($linkOperator && $operator) {
                $container->update(['user_id' => $operator->id]);
            }
        }
    }
}
