<?php

namespace Tests\Feature;

use App\Models\Container;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContainerLocationTest extends TestCase
{
    use RefreshDatabase;

    private User $boxUser;
    private User $otherBoxUser;
    private User $citizen;

    protected function setUp(): void
    {
        parent::setUp();
        // users y deposits no tienen migración en este repositorio: se simulan aquí.
        if (! Schema::hasTable('users')) {
            Schema::create('users', function ($t) {
                $t->id(); $t->string('name'); $t->string('email')->unique(); $t->string('password');
                $t->timestamp('email_verified_at')->nullable(); $t->rememberToken(); $t->timestamps();
                $t->string('role', 20)->default('user');
            });
        }
        if (! Schema::hasTable('deposits')) {
            Schema::create('deposits', function ($t) {
                $t->id(); $t->foreignId('user_id'); $t->unsignedBigInteger('classification_id')->nullable(); $t->timestamps();
            });
        }
        $this->boxUser = $this->makeContainer('cont-001', 'c1@test.co');
        $this->otherBoxUser = $this->makeContainer('cont-002', 'c2@test.co');
        $this->citizen = User::create(['name' => 'Ana', 'email' => 'ana@test.co', 'password' => 'secret123']);
    }

    private function makeContainer(string $code, string $email): User
    {
        $u = new User(['name' => $code, 'email' => $email, 'password' => 'secret123']);
        $u->role = User::ROLE_CONTAINER;
        $u->save();
        Container::create(['identifier' => $code, 'name' => "Contenedor $code", 'user_id' => $u->id]);

        return $u;
    }

    private function payload(array $over = []): array
    {
        return array_merge(['container_id' => 'cont-001', 'latitude' => 4.711, 'longitude' => -74.0721, 'timestamp' => now()->toIso8601String()], $over);
    }

    public function test_container_reports_location_and_it_is_stored(): void
    {
        Sanctum::actingAs($this->boxUser);
        $this->postJson('/api/webhooks/container-location', $this->payload())->assertOk()->assertJsonPath('updated', true);

        $c = Container::where('identifier', 'cont-001')->first();
        $this->assertEquals(4.711, $c->last_latitude);
        $this->assertNotNull($c->last_seen_at);
        $this->assertSame('online', $c->locationStatus());
    }

    public function test_cannot_update_another_containers_location(): void
    {
        Sanctum::actingAs($this->boxUser);
        $this->postJson('/api/webhooks/container-location', $this->payload(['container_id' => 'cont-002']))->assertForbidden();
        $this->assertNull(Container::where('identifier', 'cont-002')->first()->last_latitude);
    }

    public function test_validates_payload(): void
    {
        Sanctum::actingAs($this->boxUser);
        $this->postJson('/api/webhooks/container-location', $this->payload(['latitude' => 120]))->assertUnprocessable();
        $this->postJson('/api/webhooks/container-location', $this->payload(['longitude' => -300]))->assertUnprocessable();
        $this->postJson('/api/webhooks/container-location', $this->payload(['timestamp' => 'nope']))->assertUnprocessable();
        $this->postJson('/api/webhooks/container-location', ['container_id' => 'cont-001'])->assertUnprocessable();
    }

    public function test_out_of_order_reading_does_not_overwrite(): void
    {
        Sanctum::actingAs($this->boxUser);
        $this->postJson('/api/webhooks/container-location', $this->payload(['latitude' => 1.0]))->assertOk();
        $this->postJson('/api/webhooks/container-location', $this->payload(['latitude' => 2.0, 'timestamp' => now()->subMinutes(10)->toIso8601String()]))
            ->assertOk()->assertJsonPath('updated', false);
        $this->assertEquals(1.0, Container::where('identifier', 'cont-001')->first()->last_latitude);
    }

    public function test_unauthenticated_and_non_container_roles_cannot_report(): void
    {
        $this->postJson('/api/webhooks/container-location', $this->payload())->assertUnauthorized();
        Sanctum::actingAs($this->citizen);
        $this->postJson('/api/webhooks/container-location', $this->payload())->assertForbidden();
    }

    public function test_viewers_can_list_but_containers_and_guests_cannot(): void
    {
        Sanctum::actingAs($this->boxUser);
        $this->postJson('/api/webhooks/container-location', $this->payload())->assertOk();

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->boxUser);
        $this->getJson('/api/containers/locations')->assertForbidden();

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->citizen);
        $res = $this->getJson('/api/containers/locations')->assertOk();
        $res->assertJsonCount(2, 'data');
        $byId = collect($res->json('data'))->keyBy('container_id');
        $this->assertSame('online', $byId['cont-001']['status']);
        $this->assertSame('none', $byId['cont-002']['status']);
        $this->getJson('/api/containers/cont-001/location')->assertOk()->assertJsonPath('container_id', 'cont-001');
    }

    public function test_connection_details_per_container_and_ip_only_for_admin(): void
    {
        Sanctum::actingAs($this->boxUser);
        foreach ([40, 25, 10] as $secondsAgo) {
            $this->postJson('/api/webhooks/container-location', $this->payload(['timestamp' => now()->subSeconds($secondsAgo)->toIso8601String()]), ['User-Agent' => 'Mozilla/5.0 (iPhone)'])->assertOk();
        }

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->citizen);
        $res = $this->getJson('/api/containers/connections')->assertOk();
        $c1 = collect($res->json('data'))->firstWhere('container_id', 'cont-001');
        $this->assertSame('online', $c1['status']);
        $this->assertSame(3, $c1['reports_window']);
        $this->assertCount(3, $c1['series']);
        $this->assertGreaterThanOrEqual(0, $c1['latency_last_ms']);
        $this->assertNull($c1['ip']); // usuarios normales no ven IP ni dispositivo
        $this->assertNull($c1['user_agent']);
        $c2 = collect($res->json('data'))->firstWhere('container_id', 'cont-002');
        $this->assertSame('none', $c2['status']);
        $this->assertSame(0, $c2['reports_window']);

        $this->app['auth']->forgetGuards();
        $admin = User::create(['name' => 'Admin', 'email' => 'adm@test.co', 'password' => 'x']);
        $admin->role = 'admin';
        $admin->save();
        Sanctum::actingAs($admin);
        $c1 = collect($this->getJson('/api/containers/connections')->json('data'))->firstWhere('container_id', 'cont-001');
        $this->assertNotNull($c1['ip']);
        $this->assertStringContainsString('iPhone', $c1['user_agent']);

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->boxUser);
        $this->getJson('/api/containers/connections')->assertForbidden();
    }

    public function test_stale_status_after_threshold(): void
    {
        $c = Container::where('identifier', 'cont-001')->first();
        $c->update(['last_latitude' => 1, 'last_longitude' => 1, 'last_located_at' => now(), 'last_seen_at' => now()->subSeconds(Container::ONLINE_WITHIN_SECONDS + 30)]);
        $this->assertSame('stale', $c->locationStatus());
    }

    public function test_classification_is_linked_to_the_authenticated_container(): void
    {
        Sanctum::actingAs($this->boxUser);
        $this->postJson('/api/container/classifications', ['waste_type' => 'plastic', 'confidence' => 0.93])
            ->assertCreated()->assertJsonPath('container_id', 'cont-001');
        $this->postJson('/api/container/classifications', ['waste_type' => 'banana', 'confidence' => 0.9])->assertUnprocessable();
        $this->assertSame(1, Container::where('identifier', 'cont-001')->first()->classifications()->count());
        $this->assertSame(0, Container::where('identifier', 'cont-002')->first()->classifications()->count());

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->citizen);
        $this->postJson('/api/container/classifications', ['waste_type' => 'plastic', 'confidence' => 0.9])->assertForbidden();
    }

    public function test_login_returns_role_and_container(): void
    {
        $this->postJson('/api/login', ['email' => 'c1@test.co', 'password' => 'secret123'])
            ->assertOk()->assertJsonPath('user.role', 'contenedor')->assertJsonPath('user.container.id', 'cont-001');
        $this->postJson('/api/login', ['email' => 'ana@test.co', 'password' => 'secret123'])
            ->assertOk()->assertJsonPath('user.role', 'user')->assertJsonPath('user.container', null);
    }
}
