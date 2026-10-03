<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $token = $user->createToken(self::deviceLabel($request->userAgent()))->plainTextToken;

        return response()->json([
            'user' => $user->toApiArray(),
            'token' => $token,
        ]);
    }

    /** "Safari · iOS" a partir del User-Agent; el nombre del token identifica la sesión en Ajustes. */
    public static function deviceLabel(?string $ua): string
    {
        if (! $ua) {
            return 'Dispositivo desconocido';
        }
        $os = match (true) {
            (bool) preg_match('/iPhone|iPad/', $ua) => 'iOS',
            str_contains($ua, 'Android') => 'Android',
            str_contains($ua, 'Windows') => 'Windows',
            str_contains($ua, 'Mac OS X') => 'macOS',
            str_contains($ua, 'Linux') => 'Linux',
            default => 'Dispositivo',
        };
        $browser = match (true) {
            str_contains($ua, 'Edg/') => 'Edge',
            str_contains($ua, 'Firefox/') => 'Firefox',
            str_contains($ua, 'Chrome/') => 'Chrome',
            str_contains($ua, 'Safari/') => 'Safari',
            default => 'Navegador',
        };

        return "$browser · $os";
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user()->toApiArray());
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesion cerrada correctamente.']);
    }
}
