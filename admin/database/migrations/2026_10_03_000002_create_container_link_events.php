<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Un registro por cada reporte recibido en el webhook (se purga a la hora): base de las métricas de conexión.
        Schema::create('container_link_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('container_id');
            $table->timestamp('received_at', 3);
            $table->timestamp('device_at', 3)->nullable();
            // received_at - device_at. Depende del reloj del dispositivo: es una estimación.
            $table->integer('latency_ms')->nullable();
            $table->float('accuracy_m')->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            // false = lectura fuera de orden que no se aplicó.
            $table->boolean('accepted')->default(true);
            $table->index(['container_id', 'received_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('container_link_events');
    }
};
