<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private User $ana;

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
        $this->ana = User::create(['name' => 'Ana', 'email' => 'ana@test.co', 'password' => 'secret123']);
    }

    private function png(int $w = 8, int $h = 8): string
    {
        ob_start();
        imagepng(imagecreatetruecolor($w, $h));

        return 'data:image/png;base64,'.base64_encode(ob_get_clean());
    }

    public function test_updates_name_with_validation(): void
    {
        Sanctum::actingAs($this->ana);
        $this->patchJson('/api/user', ['name' => 'A'])->assertUnprocessable();
        $this->patchJson('/api/user', ['name' => '  Ana   María <b>']);
        $this->getJson('/api/user')->assertJsonPath('name', 'Ana María');
    }

    public function test_uploads_and_removes_avatar(): void
    {
        Sanctum::actingAs($this->ana);
        $this->putJson('/api/user/avatar', ['avatar' => $this->png()])->assertOk()->assertJsonPath('avatar', fn ($v) => str_starts_with($v, 'data:image/png;base64,'));
        $this->getJson('/api/user')->assertJsonPath('avatar', fn ($v) => $v !== null);
        $this->deleteJson('/api/user/avatar')->assertOk()->assertJsonPath('avatar', null);
    }

    public function test_rejects_unsafe_or_invalid_avatars(): void
    {
        Sanctum::actingAs($this->ana);
        $svg = 'data:image/svg+xml;base64,'.base64_encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
        $this->putJson('/api/user/avatar', ['avatar' => $svg])->assertUnprocessable();
        $this->putJson('/api/user/avatar', ['avatar' => 'data:image/png;base64,'.base64_encode('no soy una imagen')])->assertUnprocessable();
        $this->putJson('/api/user/avatar', ['avatar' => $this->png(2000, 10)])->assertUnprocessable(); // supera 1024 px
        $this->putJson('/api/user/avatar', ['avatar' => 'http://evil.test/x.png'])->assertUnprocessable();
    }

    public function test_changes_password_only_with_current_one(): void
    {
        Sanctum::actingAs($this->ana);
        $this->putJson('/api/user/password', ['current_password' => 'mala', 'password' => 'nueva1234', 'password_confirmation' => 'nueva1234'])->assertUnprocessable();
        $this->putJson('/api/user/password', ['current_password' => 'secret123', 'password' => 'corta', 'password_confirmation' => 'corta'])->assertUnprocessable();
        $this->putJson('/api/user/password', ['current_password' => 'secret123', 'password' => 'nueva1234', 'password_confirmation' => 'distinta1'])->assertUnprocessable();
        $this->putJson('/api/user/password', ['current_password' => 'secret123', 'password' => 'nueva1234', 'password_confirmation' => 'nueva1234'])->assertOk();
        $this->postJson('/api/login', ['email' => 'ana@test.co', 'password' => 'nueva1234'])->assertOk();
    }

    public function test_lists_and_revokes_own_sessions_only(): void
    {
        $ua = ['User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/605.1'];
        $t1 = $this->postJson('/api/login', ['email' => 'ana@test.co', 'password' => 'secret123'], $ua)->json('token');
        $this->postJson('/api/login', ['email' => 'ana@test.co', 'password' => 'secret123']);
        $beto = User::create(['name' => 'Beto', 'email' => 'beto@test.co', 'password' => 'secret123']);
        $otherId = $beto->createToken('x')->accessToken->id;

        $list = $this->withToken($t1)->getJson('/api/user/sessions')->assertOk();
        $list->assertJsonCount(2);
        $mine = collect($list->json())->firstWhere('current', true);
        $this->assertSame('Safari · iOS', $mine['device']);

        $this->withToken($t1)->deleteJson("/api/user/sessions/$otherId")->assertNotFound(); // ajena
        $this->withToken($t1)->deleteJson('/api/user/sessions')->assertOk()->assertJsonPath('revoked', 1);
        $this->withToken($t1)->getJson('/api/user/sessions')->assertJsonCount(1);
    }

    public function test_requires_authentication(): void
    {
        $this->patchJson('/api/user', ['name' => 'Ana'])->assertUnauthorized();
        $this->putJson('/api/user/avatar', ['avatar' => $this->png()])->assertUnauthorized();
    }
}
