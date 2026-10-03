<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements FilamentUser
{
    public function canAccessPanel(Panel $panel): bool
    {
        // Los contenedores inteligentes solo operan vía API; nunca entran al panel administrativo.
        return $this->roleName() !== self::ROLE_CONTAINER;
    }

    public const ROLE_ADMIN = 'admin';
    public const ROLE_USER = 'user';
    public const ROLE_CONTAINER = 'contenedor';

    /** Rol efectivo; usuarios anteriores a la columna `role` cuentan como "user". */
    public function roleName(): string
    {
        return $this->getAttribute('role') ?: self::ROLE_USER;
    }

    /** Representación pública del usuario para la API. */
    public function toApiArray(): array
    {
        $container = $this->roleName() === self::ROLE_CONTAINER ? $this->container : null;

        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->roleName(),
            'avatar' => $this->getAttribute('avatar'),
            'points' => $this->totalPoints(),
            'level' => $this->level(),
            'container' => $container ? ['id' => $container->identifier, 'name' => $container->name ?: $container->identifier] : null,
        ];
    }

    public function container()
    {
        return $this->hasOne(Container::class);
    }

    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function classifications()
    {
        return $this->hasMany(Classification::class);
    }

    public function deposits()
    {
        return $this->hasMany(Deposit::class);
    }

    public function lessonProgress()
    {
        return $this->hasMany(LessonProgress::class);
    }

    /** Puntos totales: 10 por depósito + puntos ganados en lecciones. */
    public function totalPoints(): int
    {
        return $this->deposits()->count() * 10 + (int) $this->lessonProgress()->sum('points_earned');
    }

    public function level(): int
    {
        return max(1, intdiv($this->totalPoints(), 50) + 1);
    }
}
