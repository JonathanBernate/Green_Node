<?php

namespace Tests\Feature;

use App\Models\Container;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        if (! Schema::hasTable('users')) {
            Schema::create('users', function ($t) {
                $t->id(); $t->string('name'); $t->string('email')->unique(); $t->string('password');
                $t->timestamp('email_verified_at')->nullable(); $t->rememberToken(); $t->timestamps();
                $t->string('role', 20)->default('user'); $t->mediumText('avatar')->nullable();
            });
        }
        if (! Schema::hasTable('deposits')) {
            Schema::create('deposits', function ($t) {
                $t->id(); $t->foreignId('user_id'); $t->unsignedBigInteger('classification_id')->nullable(); $t->timestamps();
            });
        }
    }

    private function data(array $over = []): array
    {
        return array_merge(['name' => 'Ana Pérez', 'email' => 'Ana@Test.co', 'password' => 'clave1234', 'password_confirmation' => 'clave1234'], $over);
    }

    public function test_registers_a_user_and_logs_them_in(): void
    {
        $res = $this->postJson('/api/register', $this->data())->assertCreated();
        $res->assertJsonPath('user.name', 'Ana Pérez')->assertJsonPath('user.email', 'ana@test.co')->assertJsonPath('user.role', 'user');
        $this->assertNotEmpty($res->json('token'));
        $this->withToken($res->json('token'))->getJson('/api/user')->assertOk()->assertJsonPath('email', 'ana@test.co');
        $this->postJson('/api/login', ['email' => 'ana@test.co', 'password' => 'clave1234'])->assertOk();
    }

    public function test_cannot_choose_a_role(): void
    {
        $this->postJson('/api/register', $this->data(['is_admin' => true, 'password_confirmation' => 'clave1234']))->assertCreated()->assertJsonPath('user.role', 'user');
        $this->assertSame('user', User::first()->roleName());
    }

    public function test_rejects_duplicate_email_case_insensitively(): void
    {
        $this->postJson('/api/register', $this->data())->assertCreated();
        $this->postJson('/api/register', $this->data(['email' => 'ANA@test.co']))
            ->assertUnprocessable()->assertJsonPath('errors.email.0', 'Ya existe una cuenta con este correo.');
    }

    public function test_validates_fields_with_spanish_messages(): void
    {
        $this->postJson('/api/register', [])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'password']);
        $this->postJson('/api/register', $this->data(['email' => 'no-es-correo']))->assertJsonPath('errors.email.0', 'Ingresa un correo válido.');
        $this->postJson('/api/register', $this->data(['password' => 'corta1', 'password_confirmation' => 'corta1']))->assertJsonValidationErrors('password');
        $this->postJson('/api/register', $this->data(['password' => 'sololetras', 'password_confirmation' => 'sololetras']))->assertJsonPath('errors.password.0', 'La contraseña debe incluir números.');
        $this->postJson('/api/register', $this->data(['password_confirmation' => 'otra12345']))->assertJsonPath('errors.password.0', 'Las contraseñas no coinciden.');
        $this->postJson('/api/register', $this->data(['name' => 'A']))->assertJsonValidationErrors('name');
    }

    private function containerData(array $over = []): array
    {
        return $this->data(array_merge([
            'role' => 'contenedor', 'container_name' => 'Plaza Central', 'container_address' => 'Cra 7 # 32-16',
        ], $over));
    }

    public function test_registers_a_container_user_with_its_container(): void
    {
        $res = $this->postJson('/api/register', $this->containerData())->assertCreated();
        $res->assertJsonPath('user.role', 'contenedor')->assertJsonPath('user.container.id', 'CONT-001')->assertJsonPath('user.container.name', 'Plaza Central');
        $c = Container::where('identifier', 'CONT-001')->first();
        $this->assertSame(User::where('email', 'ana@test.co')->first()->id, (int) $c->user_id);

        // el siguiente contenedor recibe el siguiente identificador
        $this->postJson('/api/register', $this->containerData(['email' => 'otro@test.co']))->assertCreated()->assertJsonPath('user.container.id', 'CONT-002');
    }

    public function test_container_fields_are_required_for_that_role(): void
    {
        $this->postJson('/api/register', $this->data(['role' => 'contenedor']))
            ->assertUnprocessable()->assertJsonValidationErrors(['container_name', 'container_address']);
        $this->assertSame(0, User::count()); // no queda un usuario a medias
    }

    public function test_admin_role_can_never_be_self_assigned(): void
    {
        $this->postJson('/api/register', $this->data(['role' => 'admin']))->assertUnprocessable()->assertJsonValidationErrors('role');
        $this->assertSame(0, User::count());
    }

    public function test_registration_code_is_enforced_only_for_containers_when_configured(): void
    {
        config(['greennode.container_registration_code' => 'secreto-2026']);
        $this->getJson('/api/register/options')->assertJsonPath('container_code_required', true);

        $this->postJson('/api/register', $this->containerData())->assertUnprocessable()->assertJsonValidationErrors('registration_code');
        $this->postJson('/api/register', $this->containerData(['registration_code' => 'mal']))
            ->assertUnprocessable()->assertJsonPath('errors.registration_code.0', 'El código de registro no es correcto.');
        $this->assertSame(0, User::count());
        $this->postJson('/api/register', $this->containerData(['registration_code' => 'secreto-2026']))->assertCreated();

        // un usuario normal no necesita el código
        $this->postJson('/api/register', $this->data(['email' => 'u@test.co']))->assertCreated()->assertJsonPath('user.role', 'user');
    }

    public function test_options_report_open_registration_by_default(): void
    {
        $this->getJson('/api/register/options')->assertJsonPath('container_code_required', false);
    }
}
