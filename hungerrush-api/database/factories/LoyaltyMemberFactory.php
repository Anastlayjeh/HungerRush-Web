<?php

namespace Database\Factories;

use App\Models\LoyaltyMember;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LoyaltyMember>
 */
class LoyaltyMemberFactory extends Factory
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
            'customer_id' => User::factory(),
            'points' => fake()->numberBetween(0, 5000),
            'orders_count' => fake()->numberBetween(0, 40),
            'tier' => fake()->randomElement(['bronze', 'silver', 'gold']),
            'last_activity_at' => now()->subDays(fake()->numberBetween(0, 30)),
        ];
    }
}

