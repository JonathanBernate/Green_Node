<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClassificationHistoryTest extends TestCase
{
    use RefreshDatabase;

    private User $ana;
    private User $beto;

    protected function setUp(): void
    {
        parent::setUp();
        // users, deposits y classifications no tienen migración en este repositorio: se simulan aquí.
        if (! Schema::hasTable('users')) {
            Schema::create('users', function ($t) {
                $t->id(); $t->string('name'); $t->string('email')->unique(); $t->string('password');
                $t->timestamp('email_verified_at')->nullable(); $t->rememberToken(); $t->timestamps();
                $t->string('role', 20)->default('user');
            });
        }
        if (! Schema::hasTable('classifications')) {
            Schema::create('classifications', function ($t) {
                $t->id(); $t->unsignedBigInteger('user_id'); $t->unsignedBigInteger('container_id')->nullable();
                $t->string('waste_type'); $t->decimal('confidence', 5, 4); $t->string('image_path')->nullable();
                $t->boolean('user_confirmed')->default(false); $t->string('source')->default('ai'); $t->timestamps();
            });
        }
        $this->ana = User::create(['name' => 'Ana', 'email' => 'ana@test.co', 'password' => 'secret123']);
        $this->beto = User::create(['name' => 'Beto', 'email' => 'beto@test.co', 'password' => 'secret123']);
    }

    public function test_stores_and_lists_only_own_history(): void
    {
        Sanctum::actingAs($this->ana);
        $this->postJson('/api/classifications', ['waste_type' => 'plastic', 'confidence' => 0.91])->assertCreated();
        $this->postJson('/api/classifications', ['waste_type' => 'organic', 'confidence' => 0.8])->assertCreated();
        $this->getJson('/api/classifications')->assertOk()->assertJsonCount(2)->assertJsonPath('0.waste_type', 'organic');

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->beto);
        $this->getJson('/api/classifications')->assertOk()->assertJsonCount(0);
    }

    public function test_validates_input(): void
    {
        Sanctum::actingAs($this->ana);
        $this->postJson('/api/classifications', ['waste_type' => 'banana', 'confidence' => 0.9])->assertUnprocessable();
        $this->postJson('/api/classifications', ['waste_type' => 'glass', 'confidence' => 2])->assertUnprocessable();
    }

    public function test_feedback_confirms_or_corrects_and_cannot_touch_others(): void
    {
        Sanctum::actingAs($this->ana);
        $id = $this->postJson('/api/classifications', ['waste_type' => 'plastic', 'confidence' => 0.7])->json('id');

        $this->patchJson("/api/classifications/$id/feedback", ['feedback' => 'correct'])->assertOk()->assertJsonPath('user_confirmed', true);
        $this->patchJson("/api/classifications/$id/feedback", ['feedback' => 'incorrect'])->assertUnprocessable();
        $this->patchJson("/api/classifications/$id/feedback", ['feedback' => 'incorrect', 'corrected_type' => 'glass'])
            ->assertOk()->assertJsonPath('waste_type', 'glass')->assertJsonPath('source', 'manual');

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->beto);
        $this->patchJson("/api/classifications/$id/feedback", ['feedback' => 'correct'])->assertNotFound();
    }

    public function test_deletes_one_or_all_of_own_history_only(): void
    {
        Sanctum::actingAs($this->ana);
        $a = $this->postJson('/api/classifications', ['waste_type' => 'plastic', 'confidence' => 0.7])->json('id');
        $this->postJson('/api/classifications', ['waste_type' => 'glass', 'confidence' => 0.7]);

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->beto);
        $this->postJson('/api/classifications', ['waste_type' => 'metal', 'confidence' => 0.7]);
        $this->deleteJson("/api/classifications/$a")->assertNotFound();

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->ana);
        $this->deleteJson("/api/classifications/$a")->assertOk();
        $this->getJson('/api/classifications')->assertJsonCount(1);
        $this->deleteJson('/api/classifications')->assertOk()->assertJsonPath('deleted', 1);
        $this->getJson('/api/classifications')->assertJsonCount(0);

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($this->beto);
        $this->getJson('/api/classifications')->assertJsonCount(1); // lo de otros no se toca
    }

    public function test_requires_auth_and_blocks_container_role(): void
    {
        $this->getJson('/api/classifications')->assertUnauthorized();
        $box = new User(['name' => 'c', 'email' => 'c@test.co', 'password' => 'x']);
        $box->role = 'contenedor';
        $box->save();
        Sanctum::actingAs($box);
        $this->getJson('/api/classifications')->assertForbidden();
    }
}
