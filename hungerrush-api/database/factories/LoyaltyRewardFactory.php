<?php

namespace Database\Factories;

use App\Models\LoyaltyReward;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LoyaltyReward>
 */
class LoyaltyRewardFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'restaurant_id' => Restaurant::factory(),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'points_required' => fake()->numberBetween(100, 1000),
            'reward_type' => fake()->randomElement(['discount', 'free_item', 'free_delivery', 'cashback', 'custom']),
            'status' => fake()->randomElement(['active', 'draft', 'archived']),
            'usage_count' => fake()->numberBetween(0, 300),
        ];
    }
}

