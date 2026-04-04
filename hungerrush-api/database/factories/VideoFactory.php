<?php

namespace Database\Factories;

use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Video>
 */
class VideoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement(['draft', 'published', 'archived']);

        return [
            'restaurant_id' => Restaurant::factory(),
            'menu_item_id' => MenuItem::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->sentence(),
            'media_url' => fake()->url(),
            'thumbnail_url' => fake()->imageUrl(720, 1280),
            'status' => $status,
            'published_at' => $status === 'published' ? now()->subDays(fake()->numberBetween(1, 30)) : null,
        ];
    }
}

