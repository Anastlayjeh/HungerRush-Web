<?php

namespace Tests\Unit;

use App\Services\FoodVideoModerationService;
use Tests\TestCase;

class FoodVideoModerationServiceTest extends TestCase
{
    public function test_strong_food_label_is_enough_to_mark_a_frame_as_food_related(): void
    {
        config()->set('services.hugging_face.food_keywords', ['food', 'pizza', 'burger']);
        config()->set('services.hugging_face.context_keywords', ['plate', 'restaurant']);
        config()->set('services.hugging_face.strong_match_min_score', 0.2);
        config()->set('services.hugging_face.context_match_min_score', 0.15);
        config()->set('services.hugging_face.context_min_matches', 2);
        config()->set('services.hugging_face.context_min_combined_score', 0.45);

        $service = app(FoodVideoModerationService::class);

        $this->assertTrue($service->frameLooksFoodRelatedFromPredictions([
            ['label' => 'pizza', 'score' => 0.92],
            ['label' => 'plate', 'score' => 0.88],
        ]));
    }

    public function test_plate_alone_does_not_mark_a_frame_as_food_related(): void
    {
        config()->set('services.hugging_face.food_keywords', ['food', 'pizza', 'burger']);
        config()->set('services.hugging_face.context_keywords', ['plate', 'restaurant']);
        config()->set('services.hugging_face.strong_match_min_score', 0.2);
        config()->set('services.hugging_face.context_match_min_score', 0.15);
        config()->set('services.hugging_face.context_min_matches', 2);
        config()->set('services.hugging_face.context_min_combined_score', 0.45);

        $service = app(FoodVideoModerationService::class);

        $this->assertFalse($service->frameLooksFoodRelatedFromPredictions([
            ['label' => 'plate', 'score' => 0.88],
        ]));
    }

    public function test_multiple_context_labels_can_mark_a_frame_as_food_related(): void
    {
        config()->set('services.hugging_face.food_keywords', ['food', 'pizza', 'burger']);
        config()->set('services.hugging_face.context_keywords', ['plate', 'restaurant']);
        config()->set('services.hugging_face.strong_match_min_score', 0.2);
        config()->set('services.hugging_face.context_match_min_score', 0.15);
        config()->set('services.hugging_face.context_min_matches', 2);
        config()->set('services.hugging_face.context_min_combined_score', 0.45);

        $service = app(FoodVideoModerationService::class);

        $this->assertTrue($service->frameLooksFoodRelatedFromPredictions([
            ['label' => 'plate', 'score' => 0.25],
            ['label' => 'restaurant', 'score' => 0.27],
        ]));
    }
}
