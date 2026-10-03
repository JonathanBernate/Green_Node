<?php

namespace App\Console\Commands;

use App\Models\Container;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ProvisionContainer extends Command
{
    protected $signature = 'containers:provision {code : ID público, p.ej. cont-001} {email} {password} {--name=} {--address=}';

    protected $description = 'Crea un contenedor inteligente y su usuario con rol "contenedor".';

    public function handle(): int
    {
        if (Container::where('identifier', $this->argument('code'))->exists() || User::where('email', $this->argument('email'))->exists()) {
            $this->error('Ya existe un contenedor o usuario con ese código/correo.');

            return self::FAILURE;
        }

        DB::transaction(function () {
            $user = new User(['name' => $this->option('name') ?: $this->argument('code'), 'email' => $this->argument('email'), 'password' => $this->argument('password')]);
            $user->role = User::ROLE_CONTAINER;
            $user->save();

            Container::create([
                'identifier' => $this->argument('code'),
                'name' => $this->option('name') ?: $this->argument('code'),
                'address' => $this->option('address'),
                'user_id' => $user->id,
            ]);
        });

        $this->info("Contenedor {$this->argument('code')} creado.");

        return self::SUCCESS;
    }
}
