<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonCategory;
use App\Models\LessonProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    /** Porcentaje mínimo del cuestionario para dar la lección por completada. */
    private const PASS_SCORE = 70;

    public function categories(): JsonResponse
    {
        return response()->json(
            LessonCategory::orderBy('sort_order')->get(['id', 'name', 'slug', 'icon'])
                ->map(fn ($c) => ['id' => (string) $c->id, 'name' => $c->name, 'slug' => $c->slug, 'icon' => $c->icon]),
        );
    }

    public function index(Request $request): JsonResponse
    {
        $progress = $request->user()->lessonProgress()->get()->keyBy('lesson_id');

        $lessons = Lesson::published()
            ->with('category')
            ->withCount('questions')
            ->orderBy('sort_order')->orderBy('id')
            ->get()
            ->map(fn (Lesson $l) => $this->summary($l, $progress->get($l->id)));

        return response()->json($lessons);
    }

    public function show(Request $request, Lesson $lesson): JsonResponse
    {
        abort_unless($lesson->is_published, 404);

        $lesson->load('category', 'questions')->loadCount('questions');
        $progress = $request->user()->lessonProgress()->where('lesson_id', $lesson->id)->first();

        return response()->json($this->summary($lesson, $progress) + [
            'content' => $lesson->content,
            // Nunca se envía la respuesta correcta ni la explicación antes de responder.
            'questions' => $lesson->questions->map(fn ($q) => [
                'id' => (string) $q->id,
                'question' => $q->question,
                'options' => $q->options,
            ])->values(),
        ]);
    }

    /** Califica el cuestionario y registra el avance. Los puntos se otorgan una sola vez. */
    public function submit(Request $request, Lesson $lesson): JsonResponse
    {
        abort_unless($lesson->is_published, 404);

        $data = $request->validate([
            'answers' => 'array',
            'answers.*' => 'integer|min:0',
        ]);
        $answers = $data['answers'] ?? [];

        $questions = $lesson->questions()->get();
        $results = [];
        $correct = 0;
        foreach ($questions as $q) {
            $given = $answers[$q->id] ?? null;
            $ok = $given !== null && (int) $given === $q->correct_option;
            $correct += $ok ? 1 : 0;
            $results[] = [
                'questionId' => (string) $q->id,
                'correct' => $ok,
                'correctOption' => $q->correct_option,
                'explanation' => $q->explanation,
            ];
        }

        $score = $questions->isEmpty() ? 100 : (int) round($correct / $questions->count() * 100);
        $passed = $score >= self::PASS_SCORE;

        $progress = LessonProgress::firstOrNew(['user_id' => $request->user()->id, 'lesson_id' => $lesson->id]);
        $alreadyCompleted = $progress->completed_at !== null;
        $progress->attempts = ($progress->attempts ?? 0) + 1;
        $progress->score = max((int) $progress->score, $score);
        $earned = 0;
        if ($passed && ! $alreadyCompleted) {
            $progress->completed_at = now();
            $progress->points_earned = $earned = $lesson->points;
        }
        $progress->save();

        return response()->json([
            'score' => $score,
            'passed' => $passed,
            'passScore' => self::PASS_SCORE,
            'pointsEarned' => $earned,
            'results' => $results,
            'totalPoints' => $request->user()->totalPoints(),
            'level' => $request->user()->level(),
        ]);
    }

    /** Reinicia el avance del usuario en una lección (permite repetirla; descuenta sus puntos). */
    public function resetProgress(Request $request, Lesson $lesson): JsonResponse
    {
        $request->user()->lessonProgress()->where('lesson_id', $lesson->id)->delete();

        return response()->json(['message' => 'Avance reiniciado.']);
    }

    private function summary(Lesson $l, ?LessonProgress $p): array
    {
        return [
            'id' => (string) $l->id,
            'title' => $l->title,
            'icon' => $l->icon,
            'category' => $l->category?->name,
            'categoryId' => (string) $l->lesson_category_id,
            'summary' => $l->summary,
            'durationMin' => $l->duration_min,
            'points' => $l->points,
            'hasQuiz' => ($l->questions_count ?? $l->questions()->count()) > 0,
            'completed' => $p?->completed_at !== null,
            'score' => $p?->score,
        ];
    }
}
