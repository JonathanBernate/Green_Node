<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('classifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('container_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('waste_type', ['organic', 'plastic', 'paper', 'glass', 'metal', 'special']);
            $table->decimal('confidence', 5, 4);
            $table->string('image_path')->nullable();
            $table->boolean('user_confirmed')->default(true);
            $table->enum('source', ['ai', 'manual'])->default('ai');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classifications');
    }
};
