<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassificationController;
use App\Http\Controllers\Api\ContainerClassificationController;
use App\Http\Controllers\Api\ContainerLocationController;
use App\Http\Controllers\Api\LessonController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::middleware('auth:sanctum')->prefix('lessons')->group(function () {
    Route::get('/', [LessonController::class, 'index']);
    Route::get('/{lesson}', [LessonController::class, 'show'])->whereNumber('lesson');
    Route::post('/{lesson}/submit', [LessonController::class, 'submit'])->whereNumber('lesson');
    Route::delete('/{lesson}/progress', [LessonController::class, 'resetProgress'])->whereNumber('lesson');
});
Route::middleware('auth:sanctum')->get('/lesson-categories', [LessonController::class, 'categories']);

// Rol "contenedor": clasifica residuos y reporta su ubicación (webhook). La identidad sale del token.
Route::middleware(['auth:sanctum', 'role:contenedor'])->group(function () {
    Route::post('/webhooks/container-location', [ContainerLocationController::class, 'store'])->middleware('throttle:120,1');
    Route::post('/container/classifications', [ContainerClassificationController::class, 'store'])->middleware('throttle:60,1');
});

// Consulta de ubicaciones: roles distintos de "contenedor".
Route::middleware(['auth:sanctum', 'role:admin,user'])->prefix('containers')->group(function () {
    Route::get('/locations', [ContainerLocationController::class, 'index']);
    Route::get('/{container:identifier}/location', [ContainerLocationController::class, 'show']);
});

// Historial personal de clasificaciones (usuarios que escanean).
Route::middleware(['auth:sanctum', 'role:admin,user'])->prefix('classifications')->group(function () {
    Route::get('/', [ClassificationController::class, 'index']);
    Route::post('/', [ClassificationController::class, 'store'])->middleware('throttle:60,1');
    Route::delete('/', [ClassificationController::class, 'clear']);
    Route::delete('/{id}', [ClassificationController::class, 'destroy'])->whereNumber('id');
    Route::patch('/{id}/feedback', [ClassificationController::class, 'feedback'])->whereNumber('id');
});
