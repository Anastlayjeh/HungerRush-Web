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
            'media_url' => 'https://customer-example.cloudflarestream.com/' . fake()->uuid() . '/manifest/video.m3u8',
            'thumbnail_url' => fake()->imageUrl(720, 1280),
            'cloudflare_stream_uid' => fake()->regexify('[a-f0-9]{32}'),
            'duration_seconds' => fake()->numberBetween(8, 180),
            'stream_status' => 'ready',
            'stream_ready' => true,
            'stream_hls_url' => 'https://customer-example.cloudflarestream.com/' . fake()->uuid() . '/manifest/video.m3u8',
            'stream_dash_url' => 'https://customer-example.cloudflarestream.com/' . fake()->uuid() . '/manifest/video.mpd',
            'stream_preview_url' => 'https://customer-example.cloudflarestream.com/' . fake()->uuid() . '/watch',
            'status' => $status,
            'published_at' => $status === 'published' ? now()->subDays(fake()->numberBetween(1, 30)) : null,
        ];
    }
}
