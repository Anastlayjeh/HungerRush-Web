<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Symfony\Component\Process\Process;

class FoodVideoModerationService
{
    public function moderate(string $videoPath): array
    {
        $durationSeconds = $this->probeDurationSeconds($videoPath);
        $maxDurationSeconds = (int) config('services.video_processing.max_duration_seconds', 180);

        if ($durationSeconds > $maxDurationSeconds) {
            throw ValidationException::withMessages([
                'video' => ["Videos must be {$maxDurationSeconds} seconds or shorter."],
            ]);
        }

        $framesDirectory = storage_path('app/private/video-moderation/' . Str::uuid());
        File::ensureDirectoryExists($framesDirectory);

        try {
            $framePaths = $this->extractFramePaths($videoPath, $framesDirectory);

            if ($framePaths === []) {
                throw ValidationException::withMessages([
                    'video' => ['The uploaded video could not be analyzed.'],
                ]);
            }

            $classification = $this->classifyFrames($framePaths);
        } finally {
            File::deleteDirectory($framesDirectory);
        }

        return [
            'duration_seconds' => (int) ceil($durationSeconds),
            'frame_count' => $classification['frame_count'],
            'food_frame_count' => $classification['food_frame_count'],
            'food_frame_ratio' => $classification['food_frame_ratio'],
        ];
    }

    public function frameLooksFoodRelatedFromPredictions(array $predictions): bool
    {
        if ($predictions === []) {
            return false;
        }

        $strongKeywords = $this->normalizeLabels(
            config('services.hugging_face.food_keywords', [
                'food',
                'pizza',
                'burger',
                'cheeseburger',
                'hotdog',
                'sandwich',
                'taco',
                'burrito',
                'sushi',
                'pasta',
                'noodle',
                'ramen',
                'spaghetti',
                'steak',
                'salad',
                'soup',
                'cake',
                'donut',
                'ice cream',
                'omelet',
                'bagel',
                'pretzel',
                'waffle',
                'restaurant meal',
            ])
        );
        $contextKeywords = $this->normalizeLabels(
            config('services.hugging_face.context_keywords', [
                'plate',
                'dish',
                'meal',
                'restaurant',
                'kitchen',
                'cafeteria',
                'dining',
                'table',
                'tray',
                'buffet',
            ])
        );
        $strongMatchMinScore = (float) config('services.hugging_face.strong_match_min_score', 0.2);
        $contextMatchMinScore = (float) config('services.hugging_face.context_match_min_score', 0.15);
        $contextMinMatches = max(2, (int) config('services.hugging_face.context_min_matches', 2));
        $contextMinCombinedScore = (float) config('services.hugging_face.context_min_combined_score', 0.45);

        $contextMatches = 0;
        $contextCombinedScore = 0.0;

        foreach ($predictions as $prediction) {
            $label = $this->normalizeLabel((string) ($prediction['label'] ?? ''));
            $score = (float) ($prediction['score'] ?? 0);

            if ($label === '' || $score <= 0) {
                continue;
            }

            foreach ($strongKeywords as $keyword) {
                if ($keyword !== '' && $score >= $strongMatchMinScore && str_contains($label, $keyword)) {
                    return true;
                }
            }

            foreach ($contextKeywords as $keyword) {
                if ($keyword !== '' && $score >= $contextMatchMinScore && str_contains($label, $keyword)) {
                    $contextMatches++;
                    $contextCombinedScore += $score;
                    break;
                }
            }
        }

        return $contextMatches >= $contextMinMatches
            && $contextCombinedScore >= $contextMinCombinedScore;
    }

    private function probeDurationSeconds(string $videoPath): float
    {
        $process = new Process([
            (string) config('services.video_processing.ffprobe_binary', 'ffprobe'),
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            $videoPath,
        ]);

        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('ffprobe failed. Check VIDEO_FFPROBE_BINARY and the uploaded video format.');
        }

        $duration = (float) trim($process->getOutput());

        if ($duration <= 0) {
            throw ValidationException::withMessages([
                'video' => ['The uploaded video has an invalid duration.'],
            ]);
        }

        return $duration;
    }

    private function extractFramePaths(string $videoPath, string $framesDirectory): array
    {
        $intervalSeconds = max(1, (int) config('services.video_processing.frame_interval_seconds', 3));
        $framePattern = $framesDirectory . DIRECTORY_SEPARATOR . 'frame-%03d.jpg';

        $process = new Process([
            (string) config('services.video_processing.ffmpeg_binary', 'ffmpeg'),
            '-hide_banner',
            '-loglevel',
            'error',
            '-i',
            $videoPath,
            '-vf',
            "fps=1/{$intervalSeconds}",
            '-q:v',
            '2',
            $framePattern,
        ]);

        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('ffmpeg failed while extracting video frames. Check VIDEO_FFMPEG_BINARY.');
        }

        $framePaths = collect(File::files($framesDirectory))
            ->map(fn ($file) => $file->getRealPath())
            ->filter()
            ->sort()
            ->values()
            ->all();

        if ($framePaths !== []) {
            return $framePaths;
        }

        $fallbackFrame = $framesDirectory . DIRECTORY_SEPARATOR . 'frame-001.jpg';
        $fallbackProcess = new Process([
            (string) config('services.video_processing.ffmpeg_binary', 'ffmpeg'),
            '-hide_banner',
            '-loglevel',
            'error',
            '-ss',
            '00:00:01',
            '-i',
            $videoPath,
            '-frames:v',
            '1',
            '-q:v',
            '2',
            $fallbackFrame,
        ]);

        $fallbackProcess->run();

        if ($fallbackProcess->isSuccessful() && File::exists($fallbackFrame)) {
            return [$fallbackFrame];
        }

        return [];
    }

    private function classifyFrames(array $framePaths): array
    {
        $minimumRatio = (float) config('services.hugging_face.min_food_frame_ratio', 0.6);
        $requiredFoodFrames = max(1, (int) ceil(count($framePaths) * $minimumRatio));
        $foodFrameCount = 0;

        foreach ($framePaths as $index => $framePath) {
            if ($this->isFoodFrame($framePath)) {
                $foodFrameCount++;
            }

            if ($foodFrameCount >= $requiredFoodFrames) {
                break;
            }

            $remainingFrames = count($framePaths) - ($index + 1);
            if (($foodFrameCount + $remainingFrames) < $requiredFoodFrames) {
                break;
            }
        }

        $frameCount = count($framePaths);
        $foodFrameRatio = $frameCount > 0 ? $foodFrameCount / $frameCount : 0.0;

        if ($foodFrameRatio < $minimumRatio) {
            throw ValidationException::withMessages([
                'video' => ['Only food-related videos are allowed.'],
            ]);
        }

        return [
            'frame_count' => $frameCount,
            'food_frame_count' => $foodFrameCount,
            'food_frame_ratio' => $foodFrameRatio,
        ];
    }

    private function isFoodFrame(string $framePath): bool
    {
        $token = (string) config('services.hugging_face.api_token', '');
        $model = (string) config('services.hugging_face.model', '');
        $baseUrl = rtrim((string) config('services.hugging_face.base_url', 'https://router.huggingface.co/hf-inference/models'), '/');

        if ($token === '' || $model === '') {
            throw new RuntimeException('Hugging Face is not configured. Set HUGGING_FACE_API_TOKEN and HUGGING_FACE_MODEL.');
        }

        $response = Http::acceptJson()
            ->withToken($token)
            ->timeout((int) config('services.hugging_face.timeout_seconds', 60))
            ->post("{$baseUrl}/{$model}", [
                'inputs' => base64_encode((string) file_get_contents($framePath)),
                'parameters' => [
                    'function_to_apply' => 'softmax',
                    'top_k' => max(1, (int) config('services.hugging_face.top_k', 8)),
                ],
            ]);

        if (! $response->successful()) {
            $message = $response->json('error')
                ?: $response->json('message')
                ?: $response->body();

            throw new RuntimeException("Hugging Face classification failed: {$message}");
        }

        $predictions = $response->json();
        if (! is_array($predictions) || $predictions === []) {
            throw new RuntimeException('Hugging Face classification returned an empty response.');
        }

        return $this->frameLooksFoodRelatedFromPredictions($predictions);
    }

    private function normalizeLabels(array|string $labels): array
    {
        $values = is_array($labels) ? $labels : explode(',', (string) $labels);

        return collect($values)
            ->map(fn ($label) => $this->normalizeLabel((string) $label))
            ->filter()
            ->values()
            ->all();
    }

    private function normalizeLabel(string $label): string
    {
        $value = Str::lower(trim($label));
        $value = str_replace(['-', '_'], ' ', $value);
        $value = preg_replace('/\s+/', ' ', $value) ?? $value;

        return $value;
    }
}
