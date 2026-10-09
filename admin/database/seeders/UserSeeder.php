<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/** Cuentas del sistema (idempotente). El cast `hashed` en User se encarga de hashear. */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Usuarios (contraseñas por defecto: Admin1234! / Contenedor123!)');

        $admin = User::updateOrCreate(
            ['email' => 'admin@greennode.com'],
            ['name' => 'Admin', 'password' => 'Admin1234!'],
        );
        $admin->forceFill(['role' => User::ROLE_ADMIN])->save();

        $operator = User::updateOrCreate(
            ['email' => 'contenedor@greennode.com'],
            ['name' => 'Operador Contenedores', 'password' => 'Contenedor123!'],
        );
        $operator->forceFill(['role' => User::ROLE_CONTAINER])->save();
    }
}
