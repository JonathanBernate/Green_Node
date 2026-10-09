<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Historial de clasificaciones del usuario (tabla creada originalmente a mano).
        if (! Schema::hasTable('classifications')) {
            Schema::create('classifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('waste_type', 20);
                $table->decimal('confidence', 5, 4)->default(0);
                $table->boolean('user_confirmed')->default(false);
                $table->string('source', 20)->default('ai');
                $table->timestamps();
                $table->index(['user_id', 'created_at']);
            });
        }

        // Depósitos registrados (la cuenta de puntos usa su conteo).
        if (! Schema::hasTable('deposits')) {
            Schema::create('deposits', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('classification_id')->nullable()->constrained()->nullOnDelete();
                $table->decimal('weight_kg', 8, 3)->nullable();
                $table->boolean('classification_correct')->default(false);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('deposits');
        Schema::dropIfExists('classifications');
    }
};
