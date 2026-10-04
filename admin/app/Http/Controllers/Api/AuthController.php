<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Container;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
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

    /** Roles que una persona puede elegir al registrarse (admin nunca). */
    private const SELF_REGISTER_ROLES = [User::ROLE_USER, User::ROLE_CONTAINER];

    /** Qué necesita el formulario de registro. Si CONTAINER_REGISTRATION_CODE está definido, registrar un contenedor exige ese código. */
    public function registerOptions(): JsonResponse
    {
        return response()->json(['container_code_required' => (string) config('greennode.container_registration_code') !== '']);
    }

    /**
     * Registro público. Rol "user" (por defecto) o "contenedor" (crea además su contenedor); admin nunca.
     * Inicia sesión al terminar.
     */
    public function register(Request $request): JsonResponse
    {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $isContainer = $request->input('role') === User::ROLE_CONTAINER;
        $codeRequired = (string) config('greennode.container_registration_code') !== '';

        $data = $request->validate([
            'name' => 'required|string|min:2|max:60',
            'email' => 'required|email:rfc|max:120|unique:users,email',
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'role' => ['nullable', Rule::in(self::SELF_REGISTER_ROLES)],
            'container_name' => [Rule::requiredIf($isContainer), 'nullable', 'string', 'min:2', 'max:60'],
            'container_address' => [Rule::requiredIf($isContainer), 'nullable', 'string', 'min:3', 'max:120'],
            'registration_code' => [Rule::requiredIf($isContainer && $codeRequired), 'nullable', 'string', 'max:100'],
        ], [
            'name.required' => 'Escribe tu nombre.',
            'name.min' => 'El nombre debe tener al menos 2 caracteres.',
            'name.max' => 'El nombre no puede superar 60 caracteres.',
            'email.required' => 'Escribe tu correo electrónico.',
            'email.email' => 'Ingresa un correo válido.',
            'email.unique' => 'Ya existe una cuenta con este correo.',
            'password.required' => 'Crea una contraseña.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.letters' => 'La contraseña debe incluir letras.',
            'password.numbers' => 'La contraseña debe incluir números.',
            'role.in' => 'El tipo de cuenta no es válido.',
            'container_name.required' => 'Escribe el nombre del contenedor.',
            'container_address.required' => 'Indica dónde está el contenedor.',
            'registration_code.required' => 'Ingresa el código de registro de contenedores.',
        ]);

        if ($isContainer && $codeRequired && ! hash_equals((string) config('greennode.container_registration_code'), (string) ($data['registration_code'] ?? ''))) {
            throw ValidationException::withMessages(['registration_code' => ['El código de registro no es correcto.']]);
        }

        $user = DB::transaction(function () use ($data, $isContainer) {
            $user = new User([
                'name' => trim(preg_replace('/\s+/', ' ', strip_tags($data['name']))),
                'email' => $data['email'],
                'password' => $data['password'],
            ]);
            // El rol solo puede ser uno de los permitidos arriba; no es asignable en masa.
            $user->forceFill(['role' => $isContainer ? User::ROLE_CONTAINER : User::ROLE_USER])->save();

            if ($isContainer) {
                Container::provisionFor(
                    $user,
                    trim(preg_replace('/\s+/', ' ', strip_tags($data['container_name']))),
                    trim(preg_replace('/\s+/', ' ', strip_tags($data['container_address']))),
                );
            }

            return $user;
        });

        $token = $user->createToken(self::deviceLabel($request->userAgent()))->plainTextToken;

        return response()->json(['user' => $user->refresh()->toApiArray(), 'token' => $token], 201);
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
