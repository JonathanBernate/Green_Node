<?php

use App\Http\Controllers\Api\AuthController;
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
