<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // users no tiene migración de creación en este repositorio (se creó a mano): solo se amplía si existe.
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'avatar')) {
            Schema::table('users', function (Blueprint $table) {
                // Imagen de perfil como data URI (JPEG/PNG/WebP ya redimensionada por el cliente).
                $table->mediumText('avatar')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'avatar')) {
            Schema::table('users', fn (Blueprint $table) => $table->dropColumn('avatar'));
        }
    }
};
