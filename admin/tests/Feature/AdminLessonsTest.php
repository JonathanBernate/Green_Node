<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\User;
use Database\Seeders\LessonSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminLessonsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_crud_pages_render(): void
    {
        if (! Schema::hasTable('users')) {
            Schema::create('users', function ($t) {
                $t->id(); $t->string('name'); $t->string('email')->unique(); $t->string('password');
                $t->timestamp('email_verified_at')->nullable(); $t->rememberToken(); $t->timestamps();
            });
        }
        $this->seed(LessonSeeder::class);
        $this->actingAs(User::create(['name' => 'Admin', 'email' => 'a@test.co', 'password' => 'x']));
        $lesson = Lesson::first();

        foreach (['/admin/lessons', '/admin/lessons/create', "/admin/lessons/{$lesson->id}/edit", '/admin/lesson-categories', '/admin/lesson-categories/create'] as $url) {
            $this->get($url)->assertOk();
        }
    }
}
