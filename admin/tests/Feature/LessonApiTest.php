<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\User;
use Database\Seeders\LessonSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LessonApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // users y deposits no tienen migración en este repositorio (se crearon a mano): se simulan aquí.
        if (! Schema::hasTable('users')) {
            Schema::create('users', function ($t) {
                $t->id(); $t->string('name'); $t->string('email')->unique(); $t->string('password');
                $t->timestamp('email_verified_at')->nullable(); $t->rememberToken(); $t->timestamps();
            });
        }
        if (! Schema::hasTable('deposits')) {
            Schema::create('deposits', function ($t) {
                $t->id(); $t->foreignId('user_id'); $t->unsignedBigInteger('classification_id')->nullable(); $t->timestamps();
            });
        }
        $this->seed(LessonSeeder::class);
        $this->user = User::create(['name' => 'Ana', 'email' => 'ana@test.co', 'password' => 'secret123']);
    }

    private User $user;

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/lessons')->assertUnauthorized();
    }

    public function test_index_lists_published_lessons_only(): void
    {
        Lesson::first()->update(['is_published' => false]);
        Sanctum::actingAs($this->user);

        $r = $this->getJson('/api/lessons')->assertOk();
        $this->assertCount(Lesson::published()->count(), $r->json());
        $this->assertFalse($r->json('0.completed'));
    }

    public function test_show_hides_correct_answers(): void
    {
        Sanctum::actingAs($this->user);
        $r = $this->getJson('/api/lessons/'.Lesson::first()->id)->assertOk();

        $this->assertNotEmpty($r->json('content'));
        $this->assertArrayNotHasKey('correct_option', $r->json('questions.0'));
        $this->assertArrayNotHasKey('correctOption', $r->json('questions.0'));
    }

    public function test_submit_passes_and_awards_points_once(): void
    {
        Sanctum::actingAs($this->user);
        $lesson = Lesson::with('questions')->first();
        $answers = $lesson->questions->mapWithKeys(fn ($q) => [$q->id => $q->correct_option])->all();

        $first = $this->postJson("/api/lessons/{$lesson->id}/submit", ['answers' => $answers])->assertOk();
        $this->assertSame(100, $first->json('score'));
        $this->assertTrue($first->json('passed'));
        $this->assertSame($lesson->points, $first->json('pointsEarned'));

        $second = $this->postJson("/api/lessons/{$lesson->id}/submit", ['answers' => $answers])->assertOk();
        $this->assertSame(0, $second->json('pointsEarned'));
        $this->assertSame($lesson->points, $this->user->fresh()->totalPoints());
        $this->assertTrue($this->getJson('/api/lessons')->json('0.completed'));
    }

    public function test_submit_fails_with_wrong_answers(): void
    {
        Sanctum::actingAs($this->user);
        $lesson = Lesson::with('questions')->first();
        $answers = $lesson->questions->mapWithKeys(fn ($q) => [$q->id => ($q->correct_option + 1) % 3])->all();

        $r = $this->postJson("/api/lessons/{$lesson->id}/submit", ['answers' => $answers])->assertOk();
        $this->assertFalse($r->json('passed'));
        $this->assertSame(0, $r->json('pointsEarned'));
        $this->assertFalse($this->getJson('/api/lessons')->json('0.completed'));
    }

    public function test_reset_progress_allows_retry(): void
    {
        Sanctum::actingAs($this->user);
        $lesson = Lesson::with('questions')->first();
        $answers = $lesson->questions->mapWithKeys(fn ($q) => [$q->id => $q->correct_option])->all();
        $this->postJson("/api/lessons/{$lesson->id}/submit", ['answers' => $answers]);

        $this->deleteJson("/api/lessons/{$lesson->id}/progress")->assertOk();
        $this->assertSame(0, $this->user->fresh()->totalPoints());
    }

    public function test_login_and_user_report_lesson_points(): void
    {
        Sanctum::actingAs($this->user);
        $lesson = Lesson::with('questions')->first();
        $answers = $lesson->questions->mapWithKeys(fn ($q) => [$q->id => $q->correct_option])->all();
        $this->postJson("/api/lessons/{$lesson->id}/submit", ['answers' => $answers]);

        $this->getJson('/api/user')->assertOk()->assertJsonPath('points', $lesson->points);
    }
}
