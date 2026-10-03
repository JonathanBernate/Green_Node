<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // users no tiene migración de creación en este repositorio (se creó a mano): solo se amplía si existe.
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 20)->default('user')->index();
            });
        }

        // La tabla `containers` puede existir ya (creada a mano): en ese caso solo se le añaden columnas.
        if (! Schema::hasTable('containers')) {
            Schema::create('containers', function (Blueprint $table) {
                $table->id();
                $table->string('identifier')->unique();
                $table->string('address')->nullable();
                $table->decimal('latitude', 10, 8)->nullable();
                $table->decimal('longitude', 11, 8)->nullable();
                $table->string('status')->default('active');
                $table->timestamps();
                $table->softDeletes();
            });
        }

        Schema::table('containers', function (Blueprint $table) {
            if (! Schema::hasColumn('containers', 'name')) {
                $table->string('name')->nullable();
            }
            // Usuario con rol "contenedor" que opera este contenedor (1 a 1). Fuente de verdad de la identidad.
            if (! Schema::hasColumn('containers', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->unique();
            }
            // Última ubicación reportada (null = nunca reportó). `latitude/longitude` son la posición de instalación.
            if (! Schema::hasColumn('containers', 'last_latitude')) {
                $table->decimal('last_latitude', 10, 8)->nullable();
                $table->decimal('last_longitude', 11, 8)->nullable();
                $table->float('last_accuracy_m')->nullable();
                // Momento de la lectura según el dispositivo.
                $table->timestamp('last_located_at')->nullable();
                // Momento en que el servidor recibió la actualización (reloj confiable).
                $table->timestamp('last_seen_at')->nullable();
            }
        });

        if (! Schema::hasTable('container_classifications')) {
            Schema::create('container_classifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('container_id')->constrained('containers')->cascadeOnDelete();
                $table->string('waste_type', 20);
                $table->decimal('confidence', 5, 4);
                $table->string('model')->nullable();
                $table->unsignedInteger('inference_time_ms')->nullable();
                $table->boolean('simulated')->default(false);
                $table->timestamp('classified_at');
                $table->timestamps();
                $table->index(['container_id', 'classified_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('container_classifications');
        if (Schema::hasTable('containers')) {
            Schema::table('containers', function (Blueprint $table) {
                foreach (['last_seen_at', 'last_located_at', 'last_accuracy_m', 'last_longitude', 'last_latitude'] as $col) {
                    if (Schema::hasColumn('containers', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
