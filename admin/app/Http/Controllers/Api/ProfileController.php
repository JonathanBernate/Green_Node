<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

/** Perfil del usuario autenticado: nombre, foto y contraseña. */
class ProfileController extends Controller
{
    private const AVATAR_MAX_BYTES = 262144; // 256 KB ya redimensionada

    private const AVATAR_MAX_SIDE = 1024;

    private const AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => 'required|string|min:2|max:60']);

        $user = $request->user();
        $user->update(['name' => trim(preg_replace('/\s+/', ' ', strip_tags($data['name'])))]);

        return response()->json($user->refresh()->toApiArray());
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate(['avatar' => 'required|string']);
        $uri = $request->string('avatar')->toString();

        // Solo data URI base64 de imágenes raster (nunca SVG, que puede llevar scripts).
        if (! preg_match('#^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$#', $uri, $m)) {
            throw ValidationException::withMessages(['avatar' => ['Formato de imagen no válido.']]);
        }
        $binary = base64_decode($m[2], true);
        if ($binary === false || strlen($binary) > self::AVATAR_MAX_BYTES) {
            throw ValidationException::withMessages(['avatar' => ['La imagen es demasiado grande.']]);
        }
        // Se verifica el contenido real, no solo lo que declara el encabezado.
        $info = @getimagesizefromstring($binary);
        if (! $info || ! in_array($info['mime'], self::AVATAR_MIMES, true) || max($info[0], $info[1]) > self::AVATAR_MAX_SIDE) {
            throw ValidationException::withMessages(['avatar' => ['La imagen no es válida o supera 1024 px.']]);
        }

        $user = $request->user();
        $user->forceFill(['avatar' => 'data:'.$info['mime'].';base64,'.base64_encode($binary)])->save();

        return response()->json($user->refresh()->toApiArray());
    }

    public function destroyAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->forceFill(['avatar' => null])->save();

        return response()->json($user->refresh()->toApiArray());
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = $request->user();
        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => ['La contraseña actual no es correcta.']]);
        }

        $user->update(['password' => $data['password']]);

        // Cierra las demás sesiones (otros dispositivos) y conserva la actual.
        $current = $user->currentAccessToken();
        $user->tokens()->when($current instanceof PersonalAccessToken, fn ($q) => $q->where('id', '!=', $current->id))->delete();

        return response()->json(['message' => 'Contraseña actualizada.']);
    }

    /** Sesiones (tokens) abiertas del usuario. */
    public function sessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentId = $user->currentAccessToken() instanceof PersonalAccessToken ? $user->currentAccessToken()->id : null;

        return response()->json($user->tokens()->latest('last_used_at')->latest('id')->get()->map(fn (PersonalAccessToken $t) => [
            'id' => $t->id,
            'device' => $t->name === 'auth-token' ? 'Dispositivo desconocido' : $t->name,
            'created_at' => $t->created_at?->toIso8601String(),
            'last_used_at' => ($t->last_used_at ?? $t->created_at)?->toIso8601String(),
            'current' => $t->id === $currentId,
        ])->values());
    }

    /** Cierra una sesión concreta (propia). */
    public function revokeSession(Request $request, int $id): JsonResponse
    {
        $request->user()->tokens()->findOrFail($id)->delete();

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    /** Cierra todas las sesiones menos la actual. */
    public function revokeOtherSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $current = $user->currentAccessToken();
        $deleted = $user->tokens()->when($current instanceof PersonalAccessToken, fn ($q) => $q->where('id', '!=', $current->id))->delete();

        return response()->json(['revoked' => $deleted]);
    }
}
